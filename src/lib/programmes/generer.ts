import { generateWithAI, type ProfilUtilisateur } from "@/lib/ai/client";
import {
  buildProgrammeEntrainementStructurePrompt,
  type StructureEntrainement,
} from "@/lib/ai/prompts/programme-entrainement-structure";
import { buildProgrammeEntrainementSessionPrompt } from "@/lib/ai/prompts/programme-entrainement-session";
import {
  buildProgrammeNutritionStructurePrompt,
  type StructureNutrition,
} from "@/lib/ai/prompts/programme-nutrition-structure";
import { buildProgrammeNutritionJourPrompt } from "@/lib/ai/prompts/programme-nutrition-jour";
import {
  buildProgrammeRecuperationStructurePrompt,
  type StructureRecuperation,
} from "@/lib/ai/prompts/programme-recuperation-structure";
import { buildProgrammeRecuperationJourPrompt } from "@/lib/ai/prompts/programme-recuperation-jour";
import type { Pilier } from "@prisma/client";
import type { AIUsageContext } from "@/lib/ai/usage";

// Extrait de src/app/api/programmes/generate/route.ts (11/08/2026) : logique
// partagée entre la génération initiale et le moteur d'adaptation
// (src/lib/adaptation/engine.ts), qui régénère un pilier avec les mêmes
// appels IA mais un profil enrichi de `directivesAdaptation`. Toujours en 2
// étapes (structure rapide, puis détail de chaque jour en parallèle) pour
// rester sous la limite de temps d'une fonction Vercel.
// Nombre de séances réellement attendu, lu sur le profil (23/08/2026,
// signalé par Anthony : "3 séances/semaine dans le profil, 2 générées").
// Le prompt demandait déjà EXACTEMENT ce nombre, mais rien ne le
// vérifiait : une réponse non conforme du modèle passait telle quelle.
// Les valeurs du formulaire sont de la forme "3 fois par semaine" ou
// "6 fois ou plus par semaine".
function seancesAttendues(frequence: string | null | undefined): number | null {
  if (!frequence) return null;
  const trouve = frequence.match(/\d+/);
  if (!trouve) return null;
  const n = Number(trouve[0]);
  // "6 fois ou plus" est un plancher, pas une cible exacte : on ne
  // rejette donc pas une structure qui en propose davantage.
  if (/ou plus/i.test(frequence)) return null;
  return Number.isFinite(n) && n >= 1 && n <= 7 ? n : null;
}

async function genererEntrainement(profil: ProfilUtilisateur, usage: AIUsageContext) {
  let structure = await generateWithAI<StructureEntrainement>(
    buildProgrammeEntrainementStructurePrompt(profil), usage
  );

  // Une seule relance si le compte ne correspond pas : le modèle respecte
  // la consigne dans l'immense majorité des cas, et boucler indéfiniment
  // coûterait cher pour un gain marginal. Si la relance échoue aussi, on
  // garde la structure obtenue plutôt que de bloquer la génération — un
  // programme à 2 séances reste utilisable, une erreur ne l'est pas.
  const attendu = seancesAttendues(profil.frequenceEntrainement);
  if (attendu !== null && Array.isArray(structure.jours) && structure.jours.length !== attendu) {
    console.warn(
      `[programmes] Structure à ${structure.jours.length} séance(s) au lieu de ${attendu} — relance`
    );
    const relance = await generateWithAI<StructureEntrainement>(
      `${buildProgrammeEntrainementStructurePrompt(profil)}\n\nATTENTION : la réponse précédente contenait ${structure.jours.length} jour(s) d'entraînement alors que la personne s'est engagée sur ${attendu} séance(s) par semaine. Le tableau "jours" doit contenir EXACTEMENT ${attendu} objet(s), ni plus ni moins.`,
      usage
    );
    if (Array.isArray(relance.jours) && relance.jours.length === attendu) {
      structure = relance;
    }
  }

  const seances = await Promise.all(
    structure.jours.map((jour) =>
      generateWithAI(buildProgrammeEntrainementSessionPrompt(profil, jour), usage)
    )
  );

  return {
    titre: structure.titre,
    frequenceParSemaine: structure.frequenceParSemaine,
    vueEnsemble: structure.vueEnsemble,
    contreIndications: structure.contreIndications,
    dureeProgramme: structure.dureeProgramme,
    seances,
  };
}

async function genererNutrition(profil: ProfilUtilisateur, usage: AIUsageContext) {
  const structure = await generateWithAI<StructureNutrition>(
    buildProgrammeNutritionStructurePrompt(profil), usage
  );

  const jours = await Promise.all(
    structure.jours.map((jour) => generateWithAI(buildProgrammeNutritionJourPrompt(profil, jour), usage))
  );

  return {
    titre: structure.titre,
    vueEnsemble: structure.vueEnsemble,
    contreIndications: structure.contreIndications,
    objectifsJournaliers: structure.objectifsJournaliers,
    conseilsHabitudes: structure.conseilsHabitudes,
    jours,
  };
}

async function genererRecuperation(profil: ProfilUtilisateur, usage: AIUsageContext) {
  const structure = await generateWithAI<StructureRecuperation>(
    buildProgrammeRecuperationStructurePrompt(profil), usage
  );

  const jours = await Promise.all(
    structure.jours.map((jour) =>
      generateWithAI(buildProgrammeRecuperationJourPrompt(profil, jour), usage)
    )
  );

  return {
    titre: structure.titre,
    vueEnsemble: structure.vueEnsemble,
    contreIndications: structure.contreIndications,
    jours,
  };
}

export async function genererPilier(pilier: Pilier, profil: ProfilUtilisateur, userId: string) {
  const usage = { userId, feature: `programme_${pilier.toLowerCase()}` };
  switch (pilier) {
    case "ENTRAINEMENT":
      return genererEntrainement(profil, usage);
    case "NUTRITION":
      return genererNutrition(profil, usage);
    case "RECUPERATION":
      return genererRecuperation(profil, usage);
  }
}
