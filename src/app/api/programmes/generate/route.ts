import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { genererPilier } from "@/lib/programmes/generer";
import { prochaineVersion } from "@/lib/programmes/version";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification } from "@/lib/email/client";
import { buildProgrammeAValiderEmailHtml } from "@/lib/email/coach-notification";
import { hasProgrammeAccess, getEffectivePlan } from "@/lib/subscription/plan";
import { getGenerationQuotaState, GENERATION_QUOTA_WINDOW_MS } from "@/lib/subscription/generation-quota";
import { socleEntrainement, socleNutrition, socleRecuperation, socleAcceptable } from "@/lib/programmes-socles";
import { computeProfilCompletion } from "@/lib/profil/completion";
import { buildContexteFeminin } from "@/lib/cycle/phase";
import type { Pilier } from "@prisma/client";

// Les piliers sont générés en parallèle par l'IA (appels Claude avec un
// max_tokens élevé) : ça peut dépasser la limite par défaut des fonctions
// Vercel (10s). On étend explicitement le délai autorisé (60s, plafond du
// plan Hobby). Génération elle-même (2 étapes : structure puis détail de
// chaque jour en parallèle) dans src/lib/programmes/generer.ts, partagée
// avec le moteur d'adaptation.
export const maxDuration = 60;

// Sert les 3 piliers. Pour Pass IA, le catalogue COAI déterministe évite les
// appels payants ; les profils hors socle conservent la génération sur mesure.
export async function POST() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { profile: true, subscription: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  // Génération bloquée tant que rien n'est débloqué (13/08/2026, nouveau
  // modèle d'abonnement) : la génération est disponible avec un
  // accompagnement Standard IA, Premium Remote ou VIP Présentiel actif.
  // L'inscription elle-même est gratuite et ne suffit plus.
  if (!hasProgrammeAccess(user, user.subscription)) {
    return NextResponse.json(
      { error: "Choisis ton accompagnement Standard IA, Premium Remote ou VIP Présentiel pour générer et faire évoluer ton programme." },
      { status: 403 }
    );
  }

  // Profil minimum requis (Phase 5.1, 11/08/2026) : garde-fou serveur en
  // plus du contrôle côté client (ActivationFlow) — n'empêche jamais une
  // régénération pour un abonné qui a déjà généré au moins une fois (ses
  // champs essentiels étaient forcément déjà complets à ce moment-là, et un
  // PUT /api/profil ne peut jamais les vider, seulement les compléter).
  const completion = computeProfilCompletion(user.profile);
  if (!completion.essentielComplet) {
    return NextResponse.json(
      {
        error:
          "Ton profil n'a pas encore les informations essentielles pour générer un programme sûr et pertinent.",
        champsManquants: completion.champsEssentielsManquants,
      },
      { status: 422 }
    );
  }

  // Palier Pass IA : programme 100% IA, jamais envoyé en relecture au
  // coach (statut GENERE_IA, visible immédiatement). Standard/Premium :
  // comportement inchangé, en attente de validation humaine.
  // Garde-fou grossesse/post-partum (14/08/2026, demande Anthony) : jamais
  // de programme livré sans relecture humaine pour ces statuts, quel que
  // soit le palier — même Pass IA, normalement instantané.
  const plan = getEffectivePlan(user.subscription);

  // Quota de génération (24/08/2026) — ~21 appels IA par génération, donc
  // une régénération en boucle coûte plus cher que l'abonnement. La
  // PREMIÈRE génération n'est jamais bloquée : un nouvel abonné doit
  // toujours obtenir son programme, quoi qu'il arrive.
  const aDejaUnProgramme = await prisma.programmeGenerated.findFirst({
    where: { userId: user.id },
    select: { id: true },
  });
  // Éligibilité au socle calculée avant le contrôle de quota : un abonné
  // Pass IA qui peut recevoir un socle n'est jamais bloqué, puisque le
  // servir ne coûte aucun appel IA.
  const eligibleAuSocle = plan === "PASS_IA" && socleAcceptable(user.profile ?? {});
  const quota = getGenerationQuotaState(plan, user.generationsUsed, user.generationsResetAt);

  // Vérifié avant le quota : un abonné Pass IA éligible à un socle n'est
  // jamais bloqué, puisque le servir ne coûte rien.
  if (aDejaUnProgramme && quota.epuise && !eligibleAuSocle) {
    const quand = quota.prochainReset
      ? quota.prochainReset.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
      : null;
    return NextResponse.json(
      {
        error: quand
          ? `Tu as utilisé tes ${quota.limite} régénérations de programme ce mois-ci. Tu pourras en relancer une à partir du ${quand}. Ton programme actuel reste disponible et s'adapte chaque jour à tes check-ins.`
          : `Tu as utilisé tes ${quota.limite} régénérations de programme ce mois-ci.`,
        quotaEpuise: true,
        retryable: false,
      },
      { status: 429 }
    );
  }

  const enceinteOuPostPartum =
    user.profile?.statutMaternite === "ENCEINTE" || user.profile?.statutMaternite === "POST_PARTUM";
  const statutInitial = plan === "PASS_IA" && !enceinteOuPostPartum ? "GENERE_IA" : "EN_ATTENTE";

  const profil = {
    objectifs: user.profile?.objectifs,
    niveau: user.profile?.niveau,
    equipementDisponible: user.profile?.equipementDisponible,
    lieuEntrainement: user.profile?.lieuEntrainement,
    dureeSeanceMinutes: user.profile?.dureeSeanceMinutes,
    contraintesSante: user.profile?.contraintesSante,
    antecedentsMedicaux: user.profile?.antecedentsMedicaux,
    tailleCm: user.profile?.tailleCm,
    age: user.profile?.age,
    sexe: user.profile?.sexe,
    morphologie: user.profile?.morphologie,
    frequenceEntrainement: user.profile?.frequenceEntrainement,
    sportsPratiques: user.profile?.sportsPratiques,
    habitudesAlimentaires: user.profile?.habitudesAlimentaires,
    allergiesAlimentaires: user.profile?.allergiesAlimentaires,
    repasParJour: user.profile?.repasParJour,
    hydratation: user.profile?.hydratation,
    consommationCafe: user.profile?.consommationCafe,
    consommationAlcool: user.profile?.consommationAlcool,
    qualiteSommeil: user.profile?.qualiteSommeil,
    pasMoyenParJour: user.profile?.pasMoyenParJour,
    frequenceCardiaqueRepos: user.profile?.frequenceCardiaqueRepos,
    sommeilMoyenHeures: user.profile?.sommeilMoyenHeures,
    vo2Max: user.profile?.vo2Max,
    caloriesMoyennesParJour: user.profile?.caloriesMoyennesParJour,
    hrv: user.profile?.hrv,
    resumeMontre: user.profile?.resumeMontre,
    morphologieDetectee: user.profile?.morphologieDetectee,
    observationsPosture: user.profile?.observationsPosture,
    contexteFeminin: buildContexteFeminin(user.profile ?? {}),
  };

  const piliers: Pilier[] = ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"];

  // Programme socle pour Pass IA (24/08/2026, décision Anthony :
  // "des génériques pour le full IA, plus personnalisé pour l'ultimus").
  //
  // Une génération sur mesure coûte ~21 appels IA — plus cher que
  // l'abonnement Pass IA lui-même. Le socle correspondant au profil est
  // servi tel quel : zéro appel, affichage immédiat, et contenu déjà relu
  // par Anthony. Le check-in quotidien continue de l'adapter, c'est ce qui
  // le distingue d'un PDF.
  //
  // Jamais de socle si une contrainte de santé, une grossesse ou un
  // post-partum est déclaré : le socle est construit sur un cas général et
  // les ignore. Ces profils gardent la génération sur mesure quel que soit
  // leur abonnement — règle de sécurité, pas de tarif.
  // Un socle par pilier (24/08/2026) : les trois ne dépendent pas des mêmes
  // axes, et chacun est lu indépendamment. Une nutrition socle peut donc
  // être servie pendant qu'un entraînement est généré sur mesure, si seul
  // ce dernier manque encore à la bibliothèque.
  const socles = eligibleAuSocle
    ? {
        ENTRAINEMENT: await socleEntrainement(profil),
        NUTRITION: await socleNutrition(profil),
        RECUPERATION: await socleRecuperation(profil),
      }
    : null;
  // Le quota n'est décompté que si au moins un pilier a réellement coûté
  // des appels IA.
  const socle = socles && Object.values(socles).every((v) => v !== null);

  // Réserve le quota AVANT le premier appel payant. Le précédent débit
  // après génération permettait à plusieurs requêtes concurrentes de
  // passer toutes le contrôle avec le même compteur.
  let quotaReserve = false;
  if (!socle) {
    if (quota.expire) {
      await prisma.user.updateMany({
        where: { id: user.id, generationsResetAt: user.generationsResetAt },
        data: { generationsUsed: 0, generationsResetAt: new Date() },
      });
    }

    const reservation = await prisma.user.updateMany({
      where: { id: user.id, generationsUsed: { lt: quota.limite } },
      data: { generationsUsed: { increment: 1 } },
    });
    if (reservation.count === 0) {
      return NextResponse.json(
        {
          error: `Tu as utilisé tes ${quota.limite} régénérations de programme ce mois-ci. Ton programme actuel reste disponible et continue de s'adapter.`,
          quotaEpuise: true,
          retryable: false,
        },
        { status: 429 }
      );
    }
    quotaReserve = true;
  }

  const resultats = await Promise.allSettled(
    piliers.map(async (pilier) => {
      const contenuSocle = socles?.[pilier] ?? null;

      const [contenu, version] = await Promise.all([
        contenuSocle ?? genererPilier(pilier, profil, user.id),
        prochaineVersion(user.id, pilier),
      ]);
      return prisma.programmeGenerated.create({
        data: { userId: user.id, pilier, contenu: contenu as object, statut: statutInitial, version },
      });
    })
  );

  resultats.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[programmes/generate] pilier ${piliers[i]} :`, r.reason);
    }
  });

  const echecs = resultats.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  if (echecs.length === piliers.length) {
    // Aucun résultat livré : restitue la réservation, l'utilisateur ne doit
    // pas payer le coût fonctionnel d'une panne fournisseur.
    if (quotaReserve) {
      await prisma.user.update({
        where: { id: user.id },
        data: { generationsUsed: { decrement: 1 } },
      }).catch(() => undefined);
    }
    // Message générique côté utilisateur (23/08/2026) — l'API renvoyait
    // jusqu'ici l'erreur brute du fournisseur IA, que le bouton affichait
    // telle quelle : un abonné a vu le détail d'un problème de facturation
    // interne et les identifiants de requête. Le détail complet reste dans
    // les logs serveur (console.error juste au-dessus), seul endroit où il
    // a sa place.
    //
    // Un souci de crédit/quota n'est pas de la même nature qu'une panne :
    // il se règle côté COAI, pas en réessayant. Le distinguer évite de
    // faire boucler l'utilisateur sur un bouton qui ne peut pas marcher.
    const messages = echecs.map((e) => String(e.reason).toLowerCase());
    const problemeDeQuota = messages.some(
      (m) =>
        m.includes("credit balance") ||
        m.includes("quota") ||
        m.includes("rate_limit") ||
        m.includes("insufficient")
    );

    return NextResponse.json(
      {
        error: problemeDeQuota
          ? "La génération est momentanément indisponible. L'équipe COAI est prévenue — réessaie dans quelques minutes."
          : "La génération n'a pas abouti. Réessaie dans un instant.",
        // "retryable" permet au bouton de proposer ou non un nouvel essai
        // immédiat, plutôt que d'inviter à réessayer dans le vide.
        retryable: !problemeDeQuota,
      },
      { status: 502 }
    );
  }

  const programmes = resultats
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof prisma.programmeGenerated.create>>> => r.status === "fulfilled")
    .map((r) => r.value);

  if (programmes.length > 0 && statutInitial === "EN_ATTENTE") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    // Lien direct vers la fiche de CE client (11/08/2026, amélioration
    // workflow coach) plutôt que /admin/programmes (liste générale) — le
    // coach tombe directement sur le bon programme après authentification,
    // au lieu d'avoir à le rechercher dans la liste.
    const lienValidation = `${appUrl}/admin/clients/${user.id}`;
    const utilisateur = user.prenom ?? user.email;
    await sendAdminNotification(
      "Nouveau programme à valider",
      `${utilisateur} vient de générer ${programmes.length} pilier(s) de programme, en attente de ta validation.\n\n${lienValidation}`,
      buildProgrammeAValiderEmailHtml({
        utilisateur,
        piliers: programmes.map((p) => p.pilier),
        generatedAt: programmes[0]?.generatedAt ?? new Date(),
        href: lienValidation,
      })
    );
  }

  return NextResponse.json({ programmes, echecs: echecs.length }, { status: 201 });
}
