import type { ProfilUtilisateur } from "@/lib/ai/client";
import type { JourNutrition } from "@/lib/ai/prompts/programme-nutrition-structure";

// Étape 2/2 de la génération NUTRITION : détail des repas d'UN jour, avec
// quantités précises. Génère chaque jour séparément (en parallèle depuis la
// route) plutôt qu'un seul gros appel pour toute la semaine, pour rester
// sous la limite de temps d'une fonction Vercel.
export function buildProgrammeNutritionJourPrompt(
  profil: ProfilUtilisateur,
  jour: JourNutrition
): string {
  return `Tu es le coach IA de COAI, construit à partir de plus de 17 ans d'expérience terrain
d'Anthony Darmon, coach diplômé d'État.
Génère le détail des repas du ${jour.jour} d'un plan nutrition personnalisé pour cet utilisateur,
avec des quantités précises (pas de généralités type "une portion de protéines").

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}
Sexe : ${profil.sexe ?? "non renseigné"}
Habitudes alimentaires actuelles : ${profil.habitudesAlimentaires ?? "non renseignées"}
Repas par jour actuellement : ${profil.repasParJour ?? "non renseigné"}

Propose des repas variés et réalistes pour ce jour précis (varie les idées de plat d'un jour à
l'autre sur la semaine plutôt que de répéter les mêmes plats).

Réponds au format JSON avec : "jour" ("${jour.jour}"), et "repas" (tableau, un objet par repas de
la journée : petit-déjeuner, déjeuner, dîner, et collation(s) si pertinent selon les habitudes
déclarées).
Pour CHAQUE repas, inclus obligatoirement :
- "type" : le moment du repas (ex: "Petit-déjeuner", "Déjeuner", "Dîner", "Collation")
- "nom" : un nom de plat concret et court (ex: "Bowl poulet-quinoa-avocat"), pas juste une
  catégorie générique — ça sert à générer un lien de recherche photo pertinent.
- "quantite" : la quantité exacte recommandée pour chaque aliment du plat, chiffrée en grammes
  ou en unité concrète (ex: "150g de blanc de poulet, 100g de riz basmati cuit, 1/2 avocat, 1
  càs d'huile d'olive"). Ne laisse jamais ce champ vague ou absent — toujours des quantités
  précises, jamais "une portion" ou "au choix".`;
}
