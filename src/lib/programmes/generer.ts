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
async function genererEntrainement(profil: ProfilUtilisateur, usage: AIUsageContext) {
  const structure = await generateWithAI<StructureEntrainement>(
    buildProgrammeEntrainementStructurePrompt(profil), usage
  );

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
