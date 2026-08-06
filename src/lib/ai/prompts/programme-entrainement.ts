import type { ProfilUtilisateur } from "@/lib/ai/client";

export function buildProgrammeEntrainementPrompt(profil: ProfilUtilisateur): string {
  return `Tu es le coach IA de YUMAI, fondé sur la méthode d'Anthony Darmon et plus de 17 ans d'expérience.
Génère un programme d'ENTRAÎNEMENT personnalisé pour cet utilisateur.

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Équipement disponible : ${profil.equipementDisponible ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}
Antécédents médicaux : ${profil.antecedentsMedicaux ?? "aucun connu"}
Taille : ${profil.tailleCm ? `${profil.tailleCm} cm` : "non renseignée"}
Âge : ${profil.age ? `${profil.age} ans` : "non renseigné"}
Morphologie : ${profil.morphologie ?? "non renseignée"}
Fréquence d'entraînement actuelle : ${profil.frequenceEntrainement ?? "non renseignée"}
Sport(s) déjà pratiqué(s) : ${profil.sportsPratiques ?? "non renseigné"}

Adapte le volume, l'intensité et le choix des exercices à la morphologie, à l'âge et à
la fréquence d'entraînement actuelle de l'utilisateur (ne pas repartir de zéro s'il
s'entraîne déjà, et tenir compte de la récupération nécessaire selon l'âge). Complète les
sports déjà pratiqués plutôt que de les dupliquer inutilement dans le programme. Adapte
aussi et surtout les exercices pour éviter d'aggraver les antécédents médicaux listés
(ex: éviter les mouvements à fort impact sur les genoux en cas de douleurs articulaires).

Réponds au format JSON structuré (séances de la semaine, exercices, séries/répétitions, notes).
Inclus obligatoirement, en tout début de JSON et dans cet ordre :
- "titre" : un titre court qui mentionne explicitement la fréquence hebdomadaire (ex: "Full Body — 4 séances/semaine").
- "frequenceParSemaine" : la fréquence retenue, en toutes lettres (ex: "4 séances par semaine").
- "vueEnsemble" : un court récapitulatif de la répartition sur la semaine, jour par jour ou séance par séance (ex: "Lundi : Haut du corps — Mercredi : Bas du corps — Vendredi : Full body — reste de la semaine : repos ou activité légère"), pour donner une vue d'ensemble avant le détail des séances.
- "dureeProgramme" : "3 semaines, à réévaluer et ajuster ensuite selon la progression" (ce programme est prévu pour une durée de 3 semaines avant réajustement, pas plus).`;
}
