import type { ProfilUtilisateur } from "@/lib/ai/client";
import type { JourEntrainement } from "@/lib/ai/prompts/programme-entrainement-structure";

// Étape 2/2 de la génération ENTRAÎNEMENT : détail complet d'UNE séance.
// Génère chaque jour séparément (en parallèle depuis la route) plutôt qu'un
// seul gros appel pour toute la semaine, pour rester sous la limite de temps
// d'une fonction Vercel malgré le niveau de détail demandé par séance.
export function buildProgrammeEntrainementSessionPrompt(
  profil: ProfilUtilisateur,
  jour: JourEntrainement
): string {
  return `Tu es le coach IA de COAI, fondé sur la méthode d'Anthony Darmon et plus de 17 ans d'expérience.
Génère le détail complet de LA séance du ${jour.jour} (${jour.focus}) d'un programme
d'entraînement personnalisé pour cet utilisateur.

Objectifs : ${profil.objectifs ?? "non renseignés"}
Niveau : ${profil.niveau ?? "non renseigné"}
Équipement disponible : ${profil.equipementDisponible ?? "non renseigné"}
Contraintes de santé : ${profil.contraintesSante ?? "aucune connue"}
Antécédents médicaux : ${profil.antecedentsMedicaux ?? "aucun connu"}
Âge : ${profil.age ? `${profil.age} ans` : "non renseigné"}
Sexe : ${profil.sexe ?? "non renseigné"}
Morphologie : ${profil.morphologie ?? "non renseignée"}

Adapte le volume, l'intensité et le choix des exercices à la morphologie, à l'âge, au sexe (si
renseigné — repères de force/récupération différents, sans stéréotyper) et au niveau. Adapte
aussi et surtout les exercices pour éviter d'aggraver les antécédents médicaux listés (ex: éviter
les mouvements à fort impact sur les genoux en cas de douleurs articulaires).
${
  jour.sportExistant
    ? `Ce jour s'appuie sur un sport déjà pratiqué par l'utilisateur plutôt qu'une séance de
musculation classique. Inclus un champ "notes" avec une alternative concrète et courte si la
personne ne peut ou ne veut pas pratiquer cette activité-là cette semaine (ex: "si tu ne boxes
pas cette semaine : 30 min de cardio libre + gainage"). Ne laisse jamais ce jour sans plan de
repli explicite.`
    : ""
}

Réponds au format JSON avec : "jour" ("${jour.jour}"), "nom" (nom de la séance), "echauffement"
(obligatoire, en 3 temps avant la charge de travail : (1) quelques minutes de cardio léger pour
augmenter la température corporelle et le rythme cardiaque, (2) mobilité articulaire ciblée sur
les zones sollicitées, (3) pour le premier exercice de force, une gamme montante — séries
d'approche à charge croissante avant les séries de travail, ex: "50% x10, 70% x6, 85% x3"),
et "exercices" (tableau).
Pour CHAQUE exercice, inclus obligatoirement :
- "nom"
- "series" (nombre de séries de travail, ex: "4")
- "repetitions" (nombre ou fourchette précis, ex: "8-12 répétitions" — jamais vague comme "quelques répétitions")
- "repos" (temps de récupération entre les séries, ex: "90 sec", adapté à l'objectif) — à placer juste après "repetitions"
- "charge" : repère de difficulté/RPE pour choisir la bonne charge (l'IA ne connaît pas le poids max réel de la personne), ex: "charge permettant de sentir les 2 dernières répétitions difficiles mais réalisables avec une technique propre — arrête-toi 1 à 2 répétitions avant l'échec technique" — ou "poids du corps" pour les exercices au poids du corps.
- "methode" ("Série classique" par défaut ; techniques d'intensification comme superset/bi-set/drop-set réservées aux niveaux intermédiaire/avancé, avec parcimonie, jamais pour un débutant)

IMPORTANT : respecte cet ordre exact des champs dans le JSON de chaque exercice (nom, series,
repetitions, repos, charge, methode) — c'est l'ordre d'affichage à l'utilisateur.`;
}
