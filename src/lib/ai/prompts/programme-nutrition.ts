import type { ProfilUtilisateur } from "@/lib/ai/client";

export function buildProgrammeNutritionPrompt(profil: ProfilUtilisateur): string {
  return `Tu es le coach IA de Holos, fondé sur la méthode d'Anthony Darmon.
Génère des recommandations NUTRITION personnalisées pour cet utilisateur (pas de suivi macros détaillé en V1).

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}
Morphologie : ${profil.morphologie ?? "non renseignée"}
Habitudes alimentaires actuelles : ${profil.habitudesAlimentaires ?? "non renseignées"}
Consommation de café : ${profil.consommationCafe ?? "non renseignée"}
Consommation d'alcool : ${profil.consommationAlcool ?? "non renseignée"}

Tiens compte des habitudes actuelles pour proposer des ajustements réalistes plutôt
qu'un régime générique, et adapte tes conseils café/alcool à la consommation déclarée.

Réponds au format JSON structuré (grands principes, repères par repas, conseils pratiques).`;
}
