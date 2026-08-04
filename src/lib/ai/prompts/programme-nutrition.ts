import type { ProfilUtilisateur } from "@/lib/ai/client";

export function buildProgrammeNutritionPrompt(profil: ProfilUtilisateur): string {
  return `Tu es le coach IA de Holos, fondé sur la méthode d'Anthony Darmon.
Génère des recommandations NUTRITION personnalisées pour cet utilisateur (pas de suivi macros détaillé en V1).

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}

Réponds au format JSON structuré (grands principes, repères par repas, conseils pratiques).`;
}
