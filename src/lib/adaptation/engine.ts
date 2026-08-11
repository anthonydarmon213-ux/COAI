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
import type { Pilier, ProgrammeGenerated, User, Profile, Subscription } from "@prisma/client";

const LIMITE_AUGMENTATION_CHARGE = 1.1; // +10% max par changement de charge

export type ResultatAdaptation = {
  decision: DecisionAdaptationIA["decision"];
  resume: string;
  changements: ChangementAdaptation[];
  donneesSuffisantes: boolean;
  adaptationId: string | null;
  nouvelleVersion: number | null;
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
      if (c.type !== "LOAD") return c;
      const avantNum = extraireNombre(c.avant);
      const apresNum = extraireNombre(c.apres);
      if (avantNum == null || apresNum == null) return c;
      const plafond = avantNum * LIMITE_AUGMENTATION_CHARGE;
      if (apresNum > plafond) {
        const apresClampe = Math.round(plafond * 2) / 2; // arrondi au 0.5 le plus proche
        return { ...c, apres: typeof c.apres === "number" ? apresClampe : `${apresClampe}` };
      }
      return c;
    });

  return { decision, confiance: decisionIA.confiance, changements, resume: decisionIA.resume };
}

function buildDirectiveTexte(decision: DecisionAdaptationIA): string {
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
    resumeMontre: profile?.resumeMontre,
    morphologieDetectee: profile?.morphologieDetectee,
    observationsPosture: profile?.observationsPosture,
    directivesAdaptation,
  };
}

// Orchestre une analyse d'adaptation pour un pilier donné :
// 1. Collecte les signaux réels (couche métier, jamais l'IA seule).
// 2. Si les données sont insuffisantes, retourne "pas assez de données"
//    sans même appeler l'IA (rien à analyser, rien à inventer).
// 3. Sinon, demande une décision structurée à l'IA, puis applique les
//    garde-fous de sécurité en code.
// 4. Si la décision est actionnable, régénère le contenu du pilier (même
//    pipeline que la génération initiale) avec la décision comme directive,
//    crée une nouvelle version, et trace l'adaptation avec sa raison.
// 5. Sur Transformation (coach humain), la nouvelle version attend
//    validation — jamais appliquée silencieusement.
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
  // Mode voyage : la version générée est marquée temporaire avec une date
  // de fin prévue, pour permettre "reprendre mon programme habituel" sans
  // perdre le programme d'origine (cf. reprendreProgrammeHabituel).
  temporaire?: boolean;
  finPrevue?: Date | null;
};

export async function analyserEtAdapter(
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

  const decisionBrute = await generateWithAI<DecisionAdaptationIA>(prompt);
  const decision = appliquerGardeFous(decisionBrute, signaux, options?.douleurSignaleeManuelle);

  const actionnable = decision.decision !== "GARDER";
  const plan = getEffectivePlan(user.subscription);

  let nouveauProgramme: ProgrammeGenerated | null = null;
  if (actionnable) {
    const directivesAdaptation = buildDirectiveTexte(decision);
    const profilAdaptation = buildProfilUtilisateur(user.profile, directivesAdaptation);
    const [contenu, version] = await Promise.all([
      genererPilier(pilier, profilAdaptation),
      prochaineVersion(user.id, pilier),
    ]);
    nouveauProgramme = await prisma.programmeGenerated.create({
      data: {
        userId: user.id,
        pilier,
        contenu: contenu as object,
        statut: plan === "GRATUIT" ? "GENERE_IA" : "EN_ATTENTE",
        version,
        temporaire: options?.temporaire ?? false,
        finPrevue: options?.finPrevue ?? null,
      },
    });
  }

  const statutAdaptation = !actionnable ? "APPLIQUEE" : plan === "GRATUIT" ? "APPLIQUEE" : "EN_ATTENTE";

  const adaptation = await prisma.programmeAdaptation.create({
    data: {
      userId: user.id,
      pilier,
      decision: decision.decision,
      confiance: decision.confiance,
      changements: decision.changements as unknown as object,
      resume: decision.resume,
      programmePrecedentId: programmeActuel?.id ?? null,
      programmeSuivantId: nouveauProgramme?.id ?? null,
      statut: statutAdaptation,
      contexte: (options?.contexte as object | undefined) ?? undefined,
    },
  });

  trackServerEvent("adaptation_proposed", user.id, { pilier, decision: decision.decision });

  if (statutAdaptation === "EN_ATTENTE") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sendAdminNotification(
      "Adaptation de programme à valider",
      `${user.prenom ?? user.email} a une adaptation de programme (${pilier}) en attente de ta validation.\n\n${decision.resume}\n\n${appUrl}/admin/programmes`
    );
  }

  return {
    decision: decision.decision,
    resume: decision.resume,
    changements: decision.changements,
    donneesSuffisantes: true,
    adaptationId: adaptation.id,
    nouvelleVersion: nouveauProgramme?.version ?? null,
  };
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
