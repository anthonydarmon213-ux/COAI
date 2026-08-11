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
// analyse par ailleurs valide.
function appliquerGardeFous(
  decisionIA: DecisionAdaptationIA,
  signaux: SignauxAdaptation
): DecisionAdaptationIA {
  let { decision, changements } = decisionIA;

  const douleurImportante = signaux.douleurRecente?.niveau === "IMPORTANTE";
  if (douleurImportante && decision === "PROGRESSER") {
    decision = "GARDER";
    changements = [];
    return {
      decision,
      confiance: decisionIA.confiance,
      changements,
      resume:
        "Une douleur importante a été signalée récemment : COAI maintient ton programme en l'état par prudence, plutôt que d'augmenter la charge. Si la gêne persiste, parles-en à ton coach ou à un professionnel de santé.",
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
export async function analyserEtAdapter(
  user: User & { profile: Profile | null; subscription: Subscription | null },
  pilier: Pilier,
  contrainteUtilisateur?: string | null
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
  const decision = appliquerGardeFous(decisionBrute, signaux);

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
    },
  });

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
