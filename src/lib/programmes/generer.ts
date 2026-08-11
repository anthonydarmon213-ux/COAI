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

// Extrait de src/app/api/programmes/generate/route.ts (11/08/2026) : logique
// partagée entre la génération initiale et le moteur d'adaptation
// (src/lib/adaptation/engine.ts), qui régénère un pilier avec les mêmes
// appels IA mais un profil enrichi de `directivesAdaptation`. Toujours en 2
// étapes (structure rapide, puis détail de chaque jour en parallèle) pour
// rester sous la limite de temps d'une fonction Vercel.
async function genererEntrainement(profil: ProfilUtilisateur) {
  const structure = await generateWithAI<StructureEntrainement>(
    buildProgrammeEntrainementStructurePrompt(profil)
  );

  const seances = await Promise.all(
    structure.jours.map((jour) =>
      generateWithAI(buildProgrammeEntrainementSessionPrompt(profil, jour))
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

async function genererNutrition(profil: ProfilUtilisateur) {
  const structure = await generateWithAI<StructureNutrition>(
    buildProgrammeNutritionStructurePrompt(profil)
  );

  const jours = await Promise.all(
    structure.jours.map((jour) => generateWithAI(buildProgrammeNutritionJourPrompt(profil, jour)))
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

async function genererRecuperation(profil: ProfilUtilisateur) {
  const structure = await generateWithAI<StructureRecuperation>(
    buildProgrammeRecuperationStructurePrompt(profil)
  );

  const jours = await Promise.all(
    structure.jours.map((jour) =>
      generateWithAI(buildProgrammeRecuperationJourPrompt(profil, jour))
    )
  );

  return {
    titre: structure.titre,
    vueEnsemble: structure.vueEnsemble,
    contreIndications: structure.contreIndications,
    jours,
  };
}

export async function genererPilier(pilier: Pilier, profil: ProfilUtilisateur) {
  switch (pilier) {
    case "ENTRAINEMENT":
      return genererEntrainement(profil);
    case "NUTRITION":
      return genererNutrition(profil);
    case "RECUPERATION":
      return genererRecuperation(profil);
  }
}
