import type { ProfilUtilisateur } from "@/lib/ai/client";

export type JourNutrition = {
  jour: string;
};

export type ConseilHabitude = {
  sujet: string;
  constatActuel: string;
  conseil: string;
};

export type StructureNutrition = {
  titre: string;
  vueEnsemble: string;
  objectifsJournaliers: {
    calories: string;
    proteines: string;
    glucides: string;
    lipides: string;
  };
  conseilsHabitudes: ConseilHabitude[];
  jours: JourNutrition[];
};

// Étape 1/2 de la génération NUTRITION : grands principes de la semaine,
// objectifs journaliers et conseils sur les habitudes déclarées (rapide).
// Le détail des repas de chaque jour est généré séparément ensuite (étape 2)
// pour rester sous la limite de temps d'une fonction Vercel.
export function buildProgrammeNutritionStructurePrompt(profil: ProfilUtilisateur): string {
  return `Tu es le coach IA de YUMAI, fondé sur la méthode d'Anthony Darmon.
Détermine les grands principes d'un plan NUTRITION personnalisé sur une semaine complète pour cet
utilisateur (le détail des repas de chaque jour sera généré séparément ensuite, ne le fais pas ici).

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}
Âge : ${profil.age ? `${profil.age} ans` : "non renseigné"}
Sexe : ${profil.sexe ?? "non renseigné"}
Morphologie : ${profil.morphologie ?? "non renseignée"}
Habitudes alimentaires actuelles : ${profil.habitudesAlimentaires ?? "non renseignées"}
Repas par jour actuellement : ${profil.repasParJour ?? "non renseigné"}
Hydratation actuelle : ${profil.hydratation ?? "non renseignée"}
Consommation de café : ${profil.consommationCafe ?? "non renseignée"}
Consommation d'alcool : ${profil.consommationAlcool ?? "non renseignée"}

Si le sexe est renseigné, ajuste les repères caloriques et protéiques indicatifs en conséquence
(besoins généralement différents entre hommes et femmes à gabarit/activité égale), sans jamais
culpabiliser ni faire de commentaire sur l'apparence.

Réponds uniquement avec ce JSON (rien d'autre) :
{
  "titre": "titre court, ex: Plan nutrition — maintien ~2400 kcal/jour",
  "vueEnsemble": "grands principes nutritionnels de la semaine (équilibre, structure des repas, ce sur quoi se concentrer) — pas le détail des repas jour par jour",
  "objectifsJournaliers": { "calories": "~2400 kcal", "proteines": "~150 g", "glucides": "~260 g", "lipides": "~75 g" },
  "conseilsHabitudes": [
    { "sujet": "Hydratation", "constatActuel": "...", "conseil": "..." },
    { "sujet": "Café", "constatActuel": "...", "conseil": "..." },
    { "sujet": "Alcool", "constatActuel": "...", "conseil": "..." }
  ],
  "jours": [
    { "jour": "Lundi" }
  ]
}
"objectifsJournaliers" doit être réaliste et basé sur le profil (âge, sexe, morphologie, objectifs,
niveau d'activité), pas des valeurs inventées au hasard.
Pour chaque entrée de "conseilsHabitudes", respecte TOUJOURS cet ordre de champs : "sujet", puis
"constatActuel" (la situation actuelle déclarée par l'utilisateur, factuelle), puis "conseil" (la
recommandation qui en découle) — jamais l'inverse.
Pour l'hydratation, ne donne JAMAIS un chiffre unique rigide type "2,5L minimum" : donne une
fourchette de base réaliste (ex: "1,5 à 2L par jour"), puis précise explicitement que ce repère
augmente selon la transpiration (séances intenses, sudation importante) et la température
extérieure (forte chaleur, été) — avec un ordre de grandeur concret pour ces cas (ex: "+0,5 à 1L
les jours de forte chaleur ou de séance intense").
"jours" contient un objet par jour de la semaine, les 7 jours (Lundi à Dimanche), dans l'ordre.`;
}
