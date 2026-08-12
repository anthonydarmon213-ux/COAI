import { prisma } from "@/lib/db/client";
import { generateWithAI, type ProfilUtilisateur } from "@/lib/ai/client";
import { genererPilier } from "@/lib/programmes/generer";
import { prochaineVersion } from "@/lib/programmes/version";
import { sendAdminNotification } from "@/lib/email/client";
import { getEffectivePlan } from "@/lib/subscription/plan";
import {
  buildProgrammeAdaptationDecisionPrompt,
  type DecisionAdaptationIA,
  type ChangementAdaptation,
} from "@/lib/ai/prompts/programme-adaptation-decision";
import { collecterSignaux, donneesSuffisantes, type SignauxAdaptation } from "@/lib/adaptation/signals";
import { trackServerEvent } from "@/lib/analytics/product-events";
import type { Pilier, User, Profile, Subscription } from "@prisma/client";

const LIMITE_AUGMENTATION_CHARGE = 1.1; // +10% max par changement de charge
const LIMITE_VARIATION_CALORIES = 0.1; // ±10% max par changement nutritionnel (Phase 3)

export type ResultatAdaptation = {
  decision: DecisionAdaptationIA["decision"];
  resume: string;
  changements: ChangementAdaptation[];
  donneesSuffisantes: boolean;
  adaptationId: string | null;
  nouvelleVersion: number | null;
  // true si une décision actionnable a été calculée mais pas encore
  // appliquée — l'utilisateur doit "Accepter" ou "Garder mon programme
  // actuel" (cf. confirmerAdaptation / rejeterAdaptation) avant que le
  // contenu ne soit régénéré et qu'une nouvelle version n'existe.
  enAttenteConfirmation: boolean;
};

function resumerContenuActuel(contenu: unknown): string {
  const c = contenu as Record<string, unknown> | null;
  if (!c) return "Aucun programme actuel pour ce pilier.";
  const parts: string[] = [];
  if (typeof c.titre === "string") parts.push(`Titre : ${c.titre}`);
  if (typeof c.vueEnsemble === "string") parts.push(`Vue d'ensemble : ${c.vueEnsemble}`);
  if (typeof c.frequenceParSemaine === "string") parts.push(`Fréquence : ${c.frequenceParSemaine}`);
  if (c.objectifsJournaliers) parts.push(`Objectifs journaliers : ${JSON.stringify(c.objectifsJournaliers)}`);
  return parts.length ? parts.join("\n") : "Contenu du programme actuel non résumable.";
}

function extraireNombre(valeur: string | number | null): number | null {
  if (typeof valeur === "number") return valeur;
  if (typeof valeur !== "string") return null;
  const match = valeur.replace(",", ".").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

// Garde-fous de sécurité appliqués APRÈS la réponse IA — jamais uniquement
// dans le prompt (section 24/25 de la vision produit : "ne mets jamais des
// règles critiques uniquement dans le prompt LLM"). Toute violation corrige
// la décision plutôt que de la rejeter en bloc, pour ne pas perdre une
// analyse par ailleurs valide. `douleurSignaleeManuelle` couvre le flow
// "Ma semaine change → J'ai une douleur" (signal ponctuel, pas forcément
// encore présent dans une séance loguée) en plus de la douleur détectée
// dans signaux.douleurRecente.
function appliquerGardeFous(
  decisionIA: DecisionAdaptationIA,
  signaux: SignauxAdaptation,
  douleurSignaleeManuelle?: "LEGERE" | "IMPORTANTE" | null
): DecisionAdaptationIA {
  let { decision, changements } = decisionIA;

  const douleurImportante =
    signaux.douleurRecente?.niveau === "IMPORTANTE" || douleurSignaleeManuelle === "IMPORTANTE";
  if (douleurImportante && decision === "PROGRESSER") {
    decision = "GARDER";
    changements = [];
    return {
      decision,
      confiance: decisionIA.confiance,
      changements,
      resume:
        "Une douleur importante a été signalée : COAI maintient ton programme en l'état par prudence, plutôt que d'augmenter la charge. COAI ne remplace pas un professionnel de santé — si la douleur est importante, inhabituelle ou persistante, demande l'avis d'un professionnel.",
    };
  }

  changements = changements
    .filter((c) => c.raison && c.raison.trim().length > 0)
    .map((c) => {
      if (c.type === "LOAD") {
        const avantNum = extraireNombre(c.avant);
        const apresNum = extraireNombre(c.apres);
        if (avantNum == null || apresNum == null) return c;
        const plafond = avantNum * LIMITE_AUGMENTATION_CHARGE;
        if (apresNum > plafond) {
          const apresClampe = Math.round(plafond * 2) / 2; // arrondi au 0.5 le plus proche
          return { ...c, apres: typeof c.apres === "number" ? apresClampe : `${apresClampe}` };
        }
        return c;
      }
      if (c.type === "CALORIES") {
        // Contrairement à LOAD, plafonné dans les DEUX sens : une
        // restriction extrême est tout aussi risquée qu'un surplus extrême
        // (section 12 de la vision : "ne jamais faire de modification
        // extrême").
        const avantNum = extraireNombre(c.avant);
        const apresNum = extraireNombre(c.apres);
        if (avantNum == null || apresNum == null) return c;
        const ecartMax = avantNum * LIMITE_VARIATION_CALORIES;
        const ecart = apresNum - avantNum;
        if (Math.abs(ecart) > ecartMax) {
          const apresClampe = Math.round(avantNum + Math.sign(ecart) * ecartMax);
          return { ...c, apres: typeof c.apres === "number" ? apresClampe : `${apresClampe}` };
        }
        return c;
      }
      return c;
    });

  return { decision, confiance: decisionIA.confiance, changements, resume: decisionIA.resume };
}

function buildDirectiveTexte(decision: {
  resume: string;
  changements: ChangementAdaptation[];
}): string {
  const lignes = decision.changements.map(
    (c) => `- ${c.cible} : ${c.avant ?? "non précisé"} → ${c.apres ?? "non précisé"} (${c.raison})`
  );
  return [decision.resume, ...lignes].join("\n");
}

function buildProfilUtilisateur(
  profile: Profile | null,
  directivesAdaptation?: string | null
): ProfilUtilisateur {
  return {
    objectifs: profile?.objectifs,
    niveau: profile?.niveau,
    equipementDisponible: profile?.equipementDisponible,
    lieuEntrainement: profile?.lieuEntrainement,
    dureeSeanceMinutes: profile?.dureeSeanceMinutes,
    contraintesSante: profile?.contraintesSante,
    antecedentsMedicaux: profile?.antecedentsMedicaux,
    tailleCm: profile?.tailleCm,
    age: profile?.age,
    sexe: profile?.sexe,
    morphologie: profile?.morphologie,
    frequenceEntrainement: profile?.frequenceEntrainement,
    sportsPratiques: profile?.sportsPratiques,
    habitudesAlimentaires: profile?.habitudesAlimentaires,
    allergiesAlimentaires: profile?.allergiesAlimentaires,
    repasParJour: profile?.repasParJour,
    hydratation: profile?.hydratation,
    consommationCafe: profile?.consommationCafe,
    consommationAlcool: profile?.consommationAlcool,
    qualiteSommeil: profile?.qualiteSommeil,
    pasMoyenParJour: profile?.pasMoyenParJour,
    frequenceCardiaqueRepos: profile?.frequenceCardiaqueRepos,
    sommeilMoyenHeures: profile?.sommeilMoyenHeures,
    vo2Max: profile?.vo2Max,
    caloriesMoyennesParJour: profile?.caloriesMoyennesParJour,
    hrv: profile?.hrv,
    resumeMontre: profile?.resumeMontre,
    morphologieDetectee: profile?.morphologieDetectee,
    observationsPosture: profile?.observationsPosture,
    directivesAdaptation,
  };
}

export type OptionsAdaptation = {
  // Métadonnées de la contrainte à l'origine de la demande (ex: "Ma semaine
  // change" → voyage, douleur...) — stockées telles quelles sur
  // ProgrammeAdaptation.contexte pour affichage/historique, jamais lues par
  // l'IA directement (contrainteUtilisateur, le texte, s'en charge déjà).
  contexte?: Record<string, unknown> | null;
  // Signal de douleur explicite hors séance loguée (cf. "Ma semaine change
  // → J'ai une douleur") — vient renforcer le garde-fou anti-progression,
  // en plus de signaux.douleurRecente.
  douleurSignaleeManuelle?: "LEGERE" | "IMPORTANTE" | null;
  // Mode voyage : la version générée (une fois confirmée) sera marquée
  // temporaire avec une date de fin prévue, pour permettre "reprendre mon
  // programme habituel" sans perdre le programme d'origine. Stockées dans
  // ProgrammeAdaptation.contexte (clés _temporaire/_finPrevue) le temps que
  // l'utilisateur confirme — cf. confirmerAdaptation.
  temporaire?: boolean;
  finPrevue?: Date | null;
};

// Analyse un pilier et propose une décision — NE L'APPLIQUE PLUS
// directement (11/08/2026, point 10 de la Phase 2 : "ne pas imposer
// systématiquement une modification si ce n'est pas une question de
// sécurité"). Si la décision est actionnable, elle reste "PROPOSEE" tant
// que l'utilisateur n'a pas cliqué "Accepter" (confirmerAdaptation) — le
// contenu n'est régénéré, et la nouvelle version créée, qu'à ce moment-là.
// Une décision "GARDER" reste appliquée directement : rien à confirmer
// quand rien ne change.
//
// 1. Collecte les signaux réels (couche métier, jamais l'IA seule).
// 2. Si les données sont insuffisantes, retourne "pas assez de données"
//    sans même appeler l'IA (rien à analyser, rien à inventer).
// 3. Sinon, demande une décision structurée à l'IA, puis applique les
//    garde-fous de sécurité en code.
export async function proposerAdaptation(
  user: User & { profile: Profile | null; subscription: Subscription | null },
  pilier: Pilier,
  contrainteUtilisateur?: string | null,
  options?: OptionsAdaptation
): Promise<ResultatAdaptation> {
  const [signaux, programmeActuel] = await Promise.all([
    collecterSignaux(user.id, pilier),
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier },
      orderBy: { generatedAt: "desc" },
    }),
  ]);

  const dataOk = donneesSuffisantes(signaux) || Boolean(contrainteUtilisateur);
  if (!dataOk) {
    return {
      decision: "GARDER",
      resume: "Pas encore assez de données pour recommander une modification.",
      changements: [],
      donneesSuffisantes: false,
      adaptationId: null,
      nouvelleVersion: null,
      enAttenteConfirmation: false,
    };
  }

  const profil = buildProfilUtilisateur(user.profile, null);
  const prompt = buildProgrammeAdaptationDecisionPrompt(
    pilier,
    profil,
    signaux,
    resumerContenuActuel(programmeActuel?.contenu),
    contrainteUtilisateur
  );

  const decisionBrute = await generateWithAI<DecisionAdaptationIA>(prompt, {
    userId: user.id,
    feature: "adaptation_decision",
  });
  const decision = appliquerGardeFous(decisionBrute, signaux, options?.douleurSignaleeManuelle);
  const actionnable = decision.decision !== "GARDER";

  const contexteAvecMeta = actionnable
    ? {
        ...(options?.contexte ?? {}),
        _temporaire: options?.temporaire ?? false,
        _finPrevue: options?.finPrevue ? options.finPrevue.toISOString() : null,
      }
    : ((options?.contexte as object | undefined) ?? undefined);

  const adaptation = await prisma.programmeAdaptation.create({
    data: {
      userId: user.id,
      pilier,
      decision: decision.decision,
      confiance: decision.confiance,
      changements: decision.changements as unknown as object,
      resume: decision.resume,
      programmePrecedentId: programmeActuel?.id ?? null,
      programmeSuivantId: null,
      statut: actionnable ? "PROPOSEE" : "APPLIQUEE",
      contexte: contexteAvecMeta,
    },
  });

  trackServerEvent("adaptation_proposed", user.id, { pilier, decision: decision.decision });

  return {
    decision: decision.decision,
    resume: decision.resume,
    changements: decision.changements,
    donneesSuffisantes: true,
    adaptationId: adaptation.id,
    nouvelleVersion: null,
    enAttenteConfirmation: actionnable,
  };
}

// "Accepter" — régénère réellement le contenu du pilier à partir de la
// décision déjà calculée et crée la nouvelle version. Coût IA (régénération
// complète) déplacé ici plutôt qu'à la proposition : une adaptation
// refusée ne déclenche jamais de génération inutile.
export async function confirmerAdaptation(
  userId: string,
  adaptationId: string
): Promise<{ nouvelleVersion: number } | { error: string }> {
  const adaptation = await prisma.programmeAdaptation.findUnique({ where: { id: adaptationId } });
  if (!adaptation || adaptation.userId !== userId) {
    return { error: "Adaptation introuvable." };
  }
  if (adaptation.statut !== "PROPOSEE") {
    return { error: "Cette adaptation a déjà été traitée." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true, subscription: true } });
  if (!user) return { error: "Utilisateur introuvable." };

  const changements = Array.isArray(adaptation.changements)
    ? (adaptation.changements as unknown as ChangementAdaptation[])
    : [];
  const directivesAdaptation = buildDirectiveTexte({ resume: adaptation.resume, changements });
  const profilAdaptation = buildProfilUtilisateur(user.profile, directivesAdaptation);

  const contexte = (adaptation.contexte as Record<string, unknown> | null) ?? {};
  const temporaire = Boolean(contexte._temporaire);
  const finPrevue = typeof contexte._finPrevue === "string" ? new Date(contexte._finPrevue) : null;

  const [contenu, version] = await Promise.all([
    genererPilier(adaptation.pilier, profilAdaptation, userId),
    prochaineVersion(userId, adaptation.pilier),
  ]);

  const plan = getEffectivePlan(user.subscription);
  const nouveauProgramme = await prisma.programmeGenerated.create({
    data: {
      userId,
      pilier: adaptation.pilier,
      contenu: contenu as object,
      statut: plan === "GRATUIT" ? "GENERE_IA" : "EN_ATTENTE",
      version,
      temporaire,
      finPrevue,
    },
  });

  const statutFinal = plan === "GRATUIT" ? "APPLIQUEE" : "EN_ATTENTE";
  await prisma.programmeAdaptation.update({
    where: { id: adaptationId },
    data: { programmeSuivantId: nouveauProgramme.id, statut: statutFinal },
  });

  trackServerEvent("adaptation_accepted", userId, { pilier: adaptation.pilier });
  if (temporaire) {
    trackServerEvent("travel_mode_started", userId, { pilier: adaptation.pilier, finPrevue });
  }

  if (statutFinal === "EN_ATTENTE") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sendAdminNotification(
      "Adaptation de programme à valider",
      `${user.prenom ?? user.email} a accepté une adaptation de programme (${adaptation.pilier}), en attente de ta validation.\n\n${adaptation.resume}\n\n${appUrl}/admin/programmes`
    );
  }

  return { nouvelleVersion: nouveauProgramme.version };
}

// "Garder mon programme actuel" — aucune version créée, l'adaptation
// proposée est classée refusée. Reste consultable dans l'historique
// (jamais supprimée) pour que l'utilisateur comprenne pourquoi son
// programme n'a pas changé s'il revient dessus plus tard.
export async function rejeterAdaptation(
  userId: string,
  adaptationId: string
): Promise<{ ok: true } | { error: string }> {
  const adaptation = await prisma.programmeAdaptation.findUnique({ where: { id: adaptationId } });
  if (!adaptation || adaptation.userId !== userId) {
    return { error: "Adaptation introuvable." };
  }
  if (adaptation.statut !== "PROPOSEE") {
    return { error: "Cette adaptation a déjà été traitée." };
  }

  await prisma.programmeAdaptation.update({ where: { id: adaptationId }, data: { statut: "REJETEE" } });
  trackServerEvent("adaptation_rejected", userId, { pilier: adaptation.pilier });

  return { ok: true };
}

// "Ton voyage est terminé. Reprendre ton programme habituel ?" — recrée une
// nouvelle version à partir du contenu d'AVANT l'adaptation temporaire
// (jamais une suppression : le programme voyage reste consultable dans
// l'historique des versions). Repère la version pré-voyage via
// programmePrecedentId de l'adaptation qui a activé le mode voyage.
export async function reprendreProgrammeHabituel(
  userId: string,
  pilier: Pilier
): Promise<{ nouvelleVersion: number } | null> {
  const dernierProgramme = await prisma.programmeGenerated.findFirst({
    where: { userId, pilier },
    orderBy: { generatedAt: "desc" },
  });
  if (!dernierProgramme || !dernierProgramme.temporaire) return null;

  const adaptationVoyage = await prisma.programmeAdaptation.findFirst({
    where: { userId, pilier, programmeSuivantId: dernierProgramme.id },
    orderBy: { createdAt: "desc" },
  });
  const programmeAvantVoyage = adaptationVoyage?.programmePrecedentId
    ? await prisma.programmeGenerated.findUnique({ where: { id: adaptationVoyage.programmePrecedentId } })
    : null;
  if (!programmeAvantVoyage) return null;

  const version = await prochaineVersion(userId, pilier);
  const nouveauProgramme = await prisma.programmeGenerated.create({
    data: {
      userId,
      pilier,
      contenu: programmeAvantVoyage.contenu as object,
      statut: programmeAvantVoyage.statut,
      version,
      temporaire: false,
    },
  });

  await prisma.programmeAdaptation.create({
    data: {
      userId,
      pilier,
      decision: "GARDER",
      changements: [],
      resume: "Retour au programme habituel après le mode voyage.",
      programmePrecedentId: dernierProgramme.id,
      programmeSuivantId: nouveauProgramme.id,
      statut: "APPLIQUEE",
      contexte: { type: "FIN_VOYAGE" },
    },
  });

  trackServerEvent("travel_mode_finished", userId, { pilier });

  return { nouvelleVersion: nouveauProgramme.version };
}
