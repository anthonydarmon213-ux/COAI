import type { ProfilUtilisateur } from "@/lib/ai/client";

export function buildProgrammeRecuperationPrompt(profil: ProfilUtilisateur): string {
  return `Tu es le coach IA de Holos, fondé sur la méthode d'Anthony Darmon.
Génère des recommandations de RÉCUPÉRATION personnalisées pour cet utilisateur.

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}

Réponds au format JSON structuré (sommeil, mobilité, gestion de la fatigue, jours de repos conseillés).`;
}
