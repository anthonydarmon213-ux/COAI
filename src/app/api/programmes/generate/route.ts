import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { genererPilier } from "@/lib/programmes/generer";
import { prochaineVersion } from "@/lib/programmes/version";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification } from "@/lib/email/client";
import { buildProgrammeAValiderEmailHtml } from "@/lib/email/coach-notification";
import { hasProgrammeAccess, getEffectivePlan } from "@/lib/subscription/plan";
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

// Génère dynamiquement les 3 piliers du programme (pas de bibliothèque
// pré-construite — décision actée) à partir du Profile courant de l'utilisateur.
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
  // modèle d'abonnement) : la génération est disponible avec une formule
  // Pass IA, Coaching Hybride ou VIP active.
  // L'inscription elle-même est gratuite et ne suffit plus.
  if (!hasProgrammeAccess(user, user.subscription)) {
    return NextResponse.json(
      { error: "Choisis ton accompagnement Pass IA, Coaching Hybride ou VIP pour générer et faire évoluer ton programme." },
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
  const enceinteOuPostPartum =
    user.profile?.statutMaternite === "ENCEINTE" || user.profile?.statutMaternite === "POST_PARTUM";
  const statutInitial = plan === "GRATUIT" && !enceinteOuPostPartum ? "GENERE_IA" : "EN_ATTENTE";

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

  const resultats = await Promise.allSettled(
    piliers.map(async (pilier) => {
      const [contenu, version] = await Promise.all([
        genererPilier(pilier, profil, user.id),
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
    return NextResponse.json(
      { error: "Échec de la génération IA", details: echecs.map((e) => String(e.reason)) },
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
