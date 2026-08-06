import type { ProfilUtilisateur } from "@/lib/ai/client";

export function buildProgrammeNutritionPrompt(profil: ProfilUtilisateur): string {
  return `Tu es le coach IA de YUMAI, fondé sur la méthode d'Anthony Darmon.
Génère des recommandations NUTRITION personnalisées pour cet utilisateur (pas de suivi macros détaillé en V1).

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

Tiens compte des habitudes actuelles pour proposer des ajustements réalistes plutôt
qu'un régime générique, adapte tes conseils café/alcool à la consommation déclarée,
et donne un objectif d'hydratation concret adapté à la situation actuelle déclarée.
Si le sexe est renseigné, ajuste les repères caloriques et protéiques indicatifs en
conséquence (besoins généralement différents entre hommes et femmes à gabarit/activité
égale), sans jamais culpabiliser ni faire de commentaire sur l'apparence.

Réponds au format JSON structuré (grands principes, repères par repas, conseils pratiques).
Pour chaque repère de repas ou idée de plat, inclus un champ "nom" avec un nom de plat
concret et court (ex: "Bowl poulet-quinoa-avocat"), pas juste une catégorie générique
comme "déjeuner" — ça sert à générer un lien de recherche photo pertinent.`;
}
