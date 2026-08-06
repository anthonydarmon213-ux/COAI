import type { ProfilUtilisateur } from "@/lib/ai/client";

export type JourEntrainement = {
  jour: string;
  focus: string;
  sportExistant?: boolean;
};

export type StructureEntrainement = {
  titre: string;
  frequenceParSemaine: string;
  vueEnsemble: string;
  dureeProgramme: string;
  jours: JourEntrainement[];
};

// Étape 1/2 de la génération ENTRAÎNEMENT : détermine uniquement la structure
// de la semaine (rapide), le détail de chaque séance étant généré séparément
// ensuite (étape 2) pour rester sous la limite de temps d'une fonction Vercel.
export function buildProgrammeEntrainementStructurePrompt(profil: ProfilUtilisateur): string {
  return `Tu es le coach IA de COAI, fondé sur la méthode d'Anthony Darmon et plus de 17 ans d'expérience.
Détermine la STRUCTURE d'un programme d'ENTRAÎNEMENT personnalisé pour cet utilisateur (le détail
de chaque séance sera généré séparément ensuite, ne le fais pas ici).

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Équipement disponible : ${profil.equipementDisponible ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}
Antécédents médicaux : ${profil.antecedentsMedicaux ?? "aucun connu"}
Âge : ${profil.age ? `${profil.age} ans` : "non renseigné"}
Sexe : ${profil.sexe ?? "non renseigné"}
Morphologie : ${profil.morphologie ?? "non renseignée"}
Fréquence d'entraînement actuelle : ${profil.frequenceEntrainement ?? "non renseignée"}
Sport(s) déjà pratiqué(s) : ${profil.sportsPratiques ?? "non renseigné"}

Détermine la fréquence hebdomadaire adaptée au niveau et à la fréquence actuelle (ne pas repartir
de zéro si la personne s'entraîne déjà). Complète les sports déjà pratiqués plutôt que de les
dupliquer inutilement dans le programme.

Réponds uniquement avec ce JSON (rien d'autre) :
{
  "titre": "titre court mentionnant la fréquence hebdomadaire, ex: Full Body — 4 séances/semaine",
  "frequenceParSemaine": "la fréquence en toutes lettres, ex: 4 séances par semaine",
  "vueEnsemble": "récapitulatif jour par jour de la répartition sur la semaine",
  "dureeProgramme": "3 semaines, à réévaluer et ajuster ensuite selon la progression",
  "jours": [
    { "jour": "Lundi", "focus": "Haut du corps — Push/Pull", "sportExistant": false }
  ]
}
"jours" ne contient qu'un objet par jour d'ENTRAÎNEMENT (pas les jours de repos). Mets
"sportExistant": true pour un jour qui s'appuie sur un sport déjà pratiqué par l'utilisateur
(ex: boxe, yoga) plutôt qu'une séance de musculation classique.`;
}
