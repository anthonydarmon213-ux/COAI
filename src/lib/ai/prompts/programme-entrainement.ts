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
Sexe : ${profil.sexe ?? "non renseigné"}
Morphologie : ${profil.morphologie ?? "non renseignée"}
Fréquence d'entraînement actuelle : ${profil.frequenceEntrainement ?? "non renseignée"}
Sport(s) déjà pratiqué(s) : ${profil.sportsPratiques ?? "non renseigné"}

Adapte le volume, l'intensité et le choix des exercices à la morphologie, à l'âge, au sexe
(si renseigné — repères de force et de récupération différents, sans stéréotyper : reste
avant tout guidé par le niveau et les objectifs déclarés) et à la fréquence d'entraînement
actuelle de l'utilisateur (ne pas repartir de zéro s'il s'entraîne déjà, et tenir compte de
la récupération nécessaire selon l'âge). Complète les
sports déjà pratiqués plutôt que de les dupliquer inutilement dans le programme. Adapte
aussi et surtout les exercices pour éviter d'aggraver les antécédents médicaux listés
(ex: éviter les mouvements à fort impact sur les genoux en cas de douleurs articulaires).
Pour un jour qui s'appuie sur un sport déjà pratiqué par l'utilisateur (ex: boxe, yoga),
précise toujours dans les notes de la séance une alternative concrète et courte si la
personne ne peut ou ne veut pas faire cette activité-là cette semaine (ex: "si tu ne
boxes pas cette semaine : 30 min de cardio libre + gainage"). Ne jamais laisser un jour
"sport existant" sans plan de repli explicite.

Réponds au format JSON structuré (séances de la semaine, exercices, séries/répétitions, notes).
Pour CHAQUE séance, inclus obligatoirement un champ "echauffement" décrivant un échauffement
en 3 temps avant d'attaquer la charge de travail : (1) quelques minutes de cardio léger pour
augmenter la température corporelle et le rythme cardiaque, (2) mobilité articulaire ciblée sur
les zones sollicitées par la séance, (3) pour le premier exercice de force, une gamme montante
(séries d'approche à charge croissante avant les séries de travail, ex: "50% x10, 70% x6, 85%
x3" avant la première série au poids de travail). Ne jamais faire démarrer une séance
directement à la charge de travail sans que le muscle soit préparé.
Pour CHAQUE exercice, inclus obligatoirement un champ "series" (nombre de séries de travail,
ex: "4") et un champ "repetitions" avec le nombre de répétitions ou la fourchette (ex: "8-12
répétitions", "5 répétitions", "AMRAP"). Ne laisse jamais ces champs absents ou vagues (jamais
juste "quelques répétitions").
Pour CHAQUE exercice, inclus obligatoirement un champ "charge" donnant un repère concret pour
choisir la bonne charge de travail, puisque le poids exact dépend du niveau réel de la personne
que l'IA ne connaît pas : exprime-le en repère de difficulté/RPE (ex: "charge permettant de
sentir les 2 dernières répétitions difficiles mais réalisables avec une technique propre — arrête-
toi 1 à 2 répétitions avant l'échec technique") plutôt qu'en poids absolu, sauf pour les exercices
au poids du corps où "charge" peut valoir "poids du corps" ou indiquer une variante plus/moins
difficile.
Pour CHAQUE exercice, inclus obligatoirement un champ "repos" avec le temps de récupération
conseillé entre les séries (ex: "90 sec", "2 min"), adapté à l'objectif (repos plus court en
endurance/perte de poids, plus long en force). Ne laisse jamais ce champ absent.
Pour CHAQUE exercice, inclus aussi un champ "methode" précisant la méthode de musculation
utilisée (ex: "Série classique", "Superset avec l'exercice suivant", "Bi-set", "Drop-set",
"Rest-pause", "Tri-set"). Utilise "Série classique" par défaut et réserve les techniques
d'intensification (superset, bi-set, drop-set...) aux profils niveau intermédiaire/avancé et
avec parcimonie, jamais pour un débutant.
Inclus obligatoirement, en tout début de JSON et dans cet ordre :
- "titre" : un titre court qui mentionne explicitement la fréquence hebdomadaire (ex: "Full Body — 4 séances/semaine").
- "frequenceParSemaine" : la fréquence retenue, en toutes lettres (ex: "4 séances par semaine").
- "vueEnsemble" : un court récapitulatif de la répartition sur la semaine, jour par jour ou séance par séance (ex: "Lundi : Haut du corps — Mercredi : Bas du corps — Vendredi : Full body — reste de la semaine : repos ou activité légère"), pour donner une vue d'ensemble avant le détail des séances.
- "dureeProgramme" : "3 semaines, à réévaluer et ajuster ensuite selon la progression" (ce programme est prévu pour une durée de 3 semaines avant réajustement, pas plus).`;
}
