import type { ProfilUtilisateur } from "@/lib/ai/client";

export type JourRecuperation = {
  jour: string;
  type: "Jour d'entraînement" | "Jour de repos";
};

export type StructureRecuperation = {
  titre: string;
  vueEnsemble: string;
  contreIndications: string[];
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
${
  profil.sommeilMoyenHeures || profil.frequenceCardiaqueRepos
    ? `Données de montre connectée — sommeil moyen : ${profil.sommeilMoyenHeures ? `${profil.sommeilMoyenHeures} h/nuit` : "non renseigné"}, fréquence cardiaque de repos : ${profil.frequenceCardiaqueRepos ?? "non renseignée"} bpm.`
    : ""
}
${profil.directivesAdaptation ? `\nCeci est une ADAPTATION du plan précédent, pas une création depuis zéro. Directives à respecter impérativement : ${profil.directivesAdaptation}. Garde tout ce qui fonctionne déjà, ne change que ce que les directives demandent.` : ""}

Adapte tes recommandations à la qualité de sommeil déclarée et à la consommation de café/alcool
(impact sur l'endormissement et la récupération).

Réponds uniquement avec ce JSON (rien d'autre) :
{
  "titre": "titre court, ex: Récupération — sommeil et gestion de la fatigue",
  "vueEnsemble": "grands principes de récupération pour la semaine (sommeil, gestion de la fatigue, rythme entraînement/repos) — pas le détail jour par jour",
  "contreIndications": ["pratique de récupération à éviter à cause d'une contrainte de santé ou d'un antécédent déclaré, un par élément — ex: sauna (hypertension signalée)"],
  "jours": [
    { "jour": "Lundi", "type": "Jour d'entraînement" }
  ]
}
"contreIndications" liste, de façon très visible, toute pratique de récupération à éviter à cause
d'une contrainte de santé ou d'un antécédent déclaré — tableau vide si rien n'est renseigné, jamais
une phrase générique inventée.
"jours" contient un objet par jour de la semaine, les 7 jours (Lundi à Dimanche), dans l'ordre.
Détermine "type" pour chaque jour ("Jour d'entraînement" ou "Jour de repos") à partir de la
fréquence d'entraînement déclarée, répartis de façon réaliste sur la semaine.`;
}
