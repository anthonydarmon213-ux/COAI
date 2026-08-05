import type { ProfilUtilisateur } from "@/lib/ai/client";

export function buildProgrammeRecuperationPrompt(profil: ProfilUtilisateur): string {
  return `Tu es le coach IA de YUMAI, fondé sur la méthode d'Anthony Darmon.
Génère des recommandations de RÉCUPÉRATION personnalisées pour cet utilisateur.

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}
Âge : ${profil.age ? `${profil.age} ans` : "non renseigné"}
Fréquence d'entraînement actuelle : ${profil.frequenceEntrainement ?? "non renseignée"}
Qualité de sommeil actuelle : ${profil.qualiteSommeil ?? "non renseignée"}
Consommation de café : ${profil.consommationCafe ?? "non renseignée"}
Consommation d'alcool : ${profil.consommationAlcool ?? "non renseignée"}

Adapte tes recommandations de récupération à la qualité de sommeil déclarée et à la
consommation de café/alcool (impact sur l'endormissement et la récupération).

Réponds au format JSON structuré (sommeil, mobilité, gestion de la fatigue, jours de repos conseillés).`;
}
