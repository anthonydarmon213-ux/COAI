import type { ProfilUtilisateur } from "@/lib/ai/client";

export function buildProgrammeEntrainementPrompt(profil: ProfilUtilisateur): string {
  return `Tu es le coach IA de YUMAI, fondé sur la méthode d'Anthony Darmon et plus de 17 ans d'expérience.
Génère un programme d'ENTRAÎNEMENT personnalisé pour cet utilisateur.

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Équipement disponible : ${profil.equipementDisponible ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}
Taille : ${profil.tailleCm ? `${profil.tailleCm} cm` : "non renseignée"}
Âge : ${profil.age ? `${profil.age} ans` : "non renseigné"}
Morphologie : ${profil.morphologie ?? "non renseignée"}
Fréquence d'entraînement actuelle : ${profil.frequenceEntrainement ?? "non renseignée"}

Adapte le volume, l'intensité et le choix des exercices à la morphologie, à l'âge et à
la fréquence d'entraînement actuelle de l'utilisateur (ne pas repartir de zéro s'il
s'entraîne déjà, et tenir compte de la récupération nécessaire selon l'âge).

Réponds au format JSON structuré (séances de la semaine, exercices, séries/répétitions, notes).`;
}
