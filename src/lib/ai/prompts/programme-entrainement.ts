import type { ProfilUtilisateur } from "@/lib/ai/client";

export function buildProgrammeEntrainementPrompt(profil: ProfilUtilisateur): string {
  return `Tu es le coach IA d'Anthony Darmon — Coaching augmenté, fondé sur plus de 17 ans d'expérience.
Génère un programme d'ENTRAÎNEMENT personnalisé pour cet utilisateur.

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Équipement disponible : ${profil.equipementDisponible ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}
Taille : ${profil.tailleCm ? `${profil.tailleCm} cm` : "non renseignée"}
Morphologie : ${profil.morphologie ?? "non renseignée"}
Entraînement actuel : ${profil.entrainementActuel ?? "non renseigné"}

Adapte le volume, l'intensité et le choix des exercices à la morphologie et à
l'entraînement actuel de l'utilisateur (ne pas repartir de zéro s'il a déjà une pratique).

Réponds au format JSON structuré (séances de la semaine, exercices, séries/répétitions, notes).`;
}
