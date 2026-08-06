import type { ProfilUtilisateur } from "@/lib/ai/client";

export type JourRecuperation = {
  jour: string;
  type: "Jour d'entraînement" | "Jour de repos";
};

export type StructureRecuperation = {
  titre: string;
  vueEnsemble: string;
  jours: JourRecuperation[];
};

// Étape 1/2 de la génération RÉCUPÉRATION : grands principes de la semaine
// (sommeil, gestion de la fatigue) et répartition jours d'entraînement /
// jours de repos (rapide). Le détail de chaque jour est généré séparément
// ensuite (étape 2) pour rester sous la limite de temps d'une fonction Vercel.
export function buildProgrammeRecuperationStructurePrompt(profil: ProfilUtilisateur): string {
  return `Tu es le coach IA de COAI, fondé sur la méthode d'Anthony Darmon.
Détermine les grands principes d'un plan de RÉCUPÉRATION personnalisé sur une semaine complète
pour cet utilisateur (le détail de chaque jour sera généré séparément ensuite, ne le fais pas ici).

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}
Antécédents médicaux : ${profil.antecedentsMedicaux ?? "aucun connu"}
Âge : ${profil.age ? `${profil.age} ans` : "non renseigné"}
Fréquence d'entraînement actuelle : ${profil.frequenceEntrainement ?? "non renseignée"}
Qualité de sommeil actuelle : ${profil.qualiteSommeil ?? "non renseignée"}
Consommation de café : ${profil.consommationCafe ?? "non renseignée"}
Consommation d'alcool : ${profil.consommationAlcool ?? "non renseignée"}

Adapte tes recommandations à la qualité de sommeil déclarée et à la consommation de café/alcool
(impact sur l'endormissement et la récupération).

Réponds uniquement avec ce JSON (rien d'autre) :
{
  "titre": "titre court, ex: Récupération — sommeil et gestion de la fatigue",
  "vueEnsemble": "grands principes de récupération pour la semaine (sommeil, gestion de la fatigue, rythme entraînement/repos) — pas le détail jour par jour",
  "jours": [
    { "jour": "Lundi", "type": "Jour d'entraînement" }
  ]
}
"jours" contient un objet par jour de la semaine, les 7 jours (Lundi à Dimanche), dans l'ordre.
Détermine "type" pour chaque jour ("Jour d'entraînement" ou "Jour de repos") à partir de la
fréquence d'entraînement déclarée, répartis de façon réaliste sur la semaine.`;
}
