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
  contreIndications: string[];
  dureeProgramme: string;
  jours: JourEntrainement[];
};

// Étape 1/2 de la génération ENTRAÎNEMENT : détermine uniquement la structure
// de la semaine (rapide), le détail de chaque séance étant généré séparément
// ensuite (étape 2) pour rester sous la limite de temps d'une fonction Vercel.
export function buildProgrammeEntrainementStructurePrompt(profil: ProfilUtilisateur): string {
  return `Tu es le coach IA de COAI, construit à partir de plus de 17 ans d'expérience terrain
d'Anthony Darmon, coach diplômé d'État.
Détermine la STRUCTURE d'un programme d'ENTRAÎNEMENT personnalisé pour cet utilisateur (le détail
de chaque séance sera généré séparément ensuite, ne le fais pas ici).

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Équipement disponible : ${profil.equipementDisponible ?? "non renseigné"}
Lieu d'entraînement habituel : ${profil.lieuEntrainement ?? "non renseigné"}
Durée de séance visée : ${profil.dureeSeanceMinutes ? `${profil.dureeSeanceMinutes} minutes` : "non renseignée"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}
Antécédents médicaux : ${profil.antecedentsMedicaux ?? "aucun connu"}
Âge : ${profil.age ? `${profil.age} ans` : "non renseigné"}
Sexe : ${profil.sexe ?? "non renseigné"}
Morphologie : ${profil.morphologie ?? "non renseignée"}
Fréquence d'entraînement visée (engagement réel, à respecter exactement) : ${profil.frequenceEntrainement ?? "non renseignée"}
Sport(s) déjà pratiqué(s) : ${profil.sportsPratiques ?? "non renseigné"}
${
  profil.vo2Max || profil.pasMoyenParJour || profil.frequenceCardiaqueRepos
    ? `Données de montre connectée — VO2 max : ${profil.vo2Max ?? "non renseigné"}, pas moyen/jour : ${profil.pasMoyenParJour ?? "non renseigné"}, fréquence cardiaque de repos : ${profil.frequenceCardiaqueRepos ?? "non renseignée"} bpm.`
    : ""
}
${profil.morphologieDetectee ? `Morphologie détectée par photo : ${profil.morphologieDetectee}` : ""}
${profil.observationsPosture ? `Observations de posture (photo) : ${profil.observationsPosture} — adapte le programme en conséquence (exercices correctifs, prudence sur les mouvements concernés).` : ""}
${profil.directivesAdaptation ? `\nCeci est une ADAPTATION du programme précédent, pas une création depuis zéro. Directives à respecter impérativement : ${profil.directivesAdaptation}. Garde tout ce qui fonctionne déjà, ne change que ce que les directives demandent.` : ""}

La fréquence d'entraînement indiquée est un engagement réel de la personne, pas un point de
départ à revoir à la hausse : construis la structure sur EXACTEMENT ce nombre de séances par
semaine, jamais plus, même si un nombre plus élevé te semblerait "mieux" pour ses objectifs — un
programme à 1 séance/semaine doit être aussi complet et cohérent (full body, contenu variable
d'une semaine à l'autre) qu'un programme à 4 ou 5 séances, jamais une version au rabais ni un
prétexte pour recommander davantage. Complète les sports déjà pratiqués plutôt que de les
dupliquer inutilement dans le programme. Si une durée de séance visée est renseignée, dimensionne
le volume (nombre d'exercices, séries) de chaque séance pour qu'elle tienne réellement dans ce
temps — ne compte pas sur des séances plus longues que ce que la personne a dit pouvoir tenir.

Réponds uniquement avec ce JSON (rien d'autre) :
{
  "titre": "titre court mentionnant la fréquence hebdomadaire, ex: Full Body — 4 séances/semaine",
  "frequenceParSemaine": "la fréquence en toutes lettres, ex: 4 séances par semaine",
  "vueEnsemble": "récapitulatif jour par jour de la répartition sur la semaine",
  "contreIndications": ["mouvement ou type d'exercice à éviter à cause d'une contrainte de santé ou d'un antécédent déclaré, un par élément — ex: squat profond (douleur de genou signalée)"],
  "dureeProgramme": "3 semaines, à réévaluer et ajuster ensuite selon la progression",
  "jours": [
    { "jour": "Lundi", "focus": "Haut du corps — Push/Pull", "sportExistant": false }
  ]
}
"contreIndications" liste, de façon très visible, tout mouvement ou type d'effort à éviter à cause
d'une contrainte de santé ou d'un antécédent déclaré — tableau vide si rien n'est renseigné, jamais
une phrase générique inventée.
"jours" ne contient qu'un objet par jour d'ENTRAÎNEMENT (pas les jours de repos). Mets
"sportExistant": true pour un jour qui s'appuie sur un sport déjà pratiqué par l'utilisateur
(ex: boxe, yoga) plutôt qu'une séance de musculation classique.`;
}
