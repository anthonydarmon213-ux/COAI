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
  contreIndications: string[];
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
  return `Tu es le coach IA de COAI, construit à partir de plus de 17 ans d'expérience terrain
d'Anthony Darmon, coach diplômé d'État.
Détermine les grands principes d'un plan NUTRITION personnalisé sur une semaine complète pour cet
utilisateur (le détail des repas de chaque jour sera généré séparément ensuite, ne le fais pas ici).

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}
Âge : ${profil.age ? `${profil.age} ans` : "non renseigné"}
Sexe : ${profil.sexe ?? "non renseigné"}
Morphologie : ${profil.morphologie ?? "non renseignée"}
Allergies, intolérances ou régime alimentaire particulier : ${profil.allergiesAlimentaires ?? "aucun connu"}
Habitudes alimentaires actuelles : ${profil.habitudesAlimentaires ?? "non renseignées"}
Repas par jour actuellement : ${profil.repasParJour ?? "non renseigné"}
Hydratation actuelle : ${profil.hydratation ?? "non renseignée"}
Consommation de café : ${profil.consommationCafe ?? "non renseignée"}
Consommation d'alcool : ${profil.consommationAlcool ?? "non renseignée"}
${profil.caloriesMoyennesParJour ? `Calories moyennes dépensées/jour (montre connectée) : ${profil.caloriesMoyennesParJour}` : ""}
${profil.morphologieDetectee ? `Morphologie détectée par photo (à recouper avec la morphologie déclarée ci-dessus) : ${profil.morphologieDetectee}` : ""}
${profil.contexteFeminin ? `\n${profil.contexteFeminin}` : ""}
${profil.directivesAdaptation ? `\nCeci est une ADAPTATION du plan précédent, pas une création depuis zéro. Directives à respecter impérativement : ${profil.directivesAdaptation}. Garde tout ce qui fonctionne déjà, ne change que ce que les directives demandent.` : ""}

Si le sexe est renseigné, ajuste les repères caloriques et protéiques indicatifs en conséquence
(besoins généralement différents entre hommes et femmes à gabarit/activité égale), sans jamais
culpabiliser ni faire de commentaire sur l'apparence.

Si des intolérances, un régime sans gluten, des douleurs abdominales ou un terrain inflammatoire
sont mentionnés dans les allergies/contraintes de santé ci-dessus, privilégie une approche
anti-inflammatoire (aliments entiers, oméga-3, légumes variés, épices comme le curcuma/gingembre,
limitation des aliments ultra-transformés et du sucre raffiné) et exclus strictement l'aliment
concerné de tous les repas — jamais une suggestion "à tester quand même".

Réponds uniquement avec ce JSON (rien d'autre) :
{
  "titre": "titre court, ex: Plan nutrition — maintien ~2400 kcal/jour",
  "vueEnsemble": "grands principes nutritionnels de la semaine (équilibre, structure des repas, ce sur quoi se concentrer) — pas le détail des repas jour par jour",
  "contreIndications": ["aliment ou catégorie d'aliments à éviter absolument, un par élément — ex: arachides (allergie déclarée)"],
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
"contreIndications" liste, de façon très visible, tout aliment ou catégorie à éviter à cause d'une
allergie, intolérance ou régime déclaré — tableau vide si rien n'est renseigné, jamais une phrase
générique inventée.
"objectifsJournaliers" doit être réaliste et basé sur le profil (âge, sexe, morphologie, objectifs,
niveau d'activité), pas des valeurs inventées au hasard.
Pour chaque entrée de "conseilsHabitudes", respecte TOUJOURS cet ordre de champs : "sujet", puis
"constatActuel" (la situation actuelle déclarée par l'utilisateur, factuelle), puis "conseil" (la
recommandation qui en découle) — jamais l'inverse.
"conseil" doit toujours être une action concrète et chiffrée quand c'est pertinent (ex: "remplace
le café de l'après-midi par du thé vert, effet moins marqué sur le sommeil" plutôt que "fais
attention à ta consommation de café") — jamais une généralité du type "mange équilibré" ou "bois
suffisamment d'eau" sans plus de précision.
Pour l'hydratation, ne donne JAMAIS un chiffre unique rigide type "2,5L minimum" : donne une
fourchette de base réaliste (ex: "1,5 à 2L par jour"), puis précise explicitement que ce repère
augmente selon la transpiration (séances intenses, sudation importante) et la température
extérieure (forte chaleur, été) — avec un ordre de grandeur concret pour ces cas (ex: "+0,5 à 1L
les jours de forte chaleur ou de séance intense").
"jours" contient un objet par jour de la semaine, les 7 jours (Lundi à Dimanche), dans l'ordre.`;
}
