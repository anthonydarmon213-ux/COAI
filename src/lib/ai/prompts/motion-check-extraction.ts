// Motion Check (22/08/2026, demande Anthony) — analyse d'une photo prise en
// bas de mouvement pour donner un retour de technique.
//
// C'est le prompt le plus prudent de l'application, et volontairement :
// contrairement à un repas mal estimé, un retour technique faux sur un
// mouvement chargé peut blesser. Trois règles en découlent :
//   1. Refus explicite dès que l'image ne permet pas de juger (angle, corps
//      partiellement hors cadre, flou, position intermédiaire).
//   2. Aucun point signalé sans qu'il soit RÉELLEMENT visible sur la photo —
//      jamais l'erreur "classique" de l'exercice supposée présente.
//   3. Aucun diagnostic de douleur, de pathologie ni de déséquilibre
//      structurel : COAI observe une position, pas un corps.
export function buildMotionCheckPrompt(nomExercice: string): string {
  return `Tu observes la photo d'une personne en train d'exécuter cet exercice : "${nomExercice}".
Elle veut savoir si sa position est correcte.

Renvoie un objet JSON avec ces champs :
{
  "analysable": true ou false,
  "phaseVisible": "la phase du mouvement visible sur la photo (ex: bas du squat, verrouillage), sinon null",
  "points": [
    {
      "repere": "le point de technique observé (ex: alignement des genoux, position du dos)",
      "constat": "ce que tu vois RÉELLEMENT sur cette photo, en une phrase",
      "statut": "ok" | "a_surveiller"
    }
  ],
  "conseil": "UNE consigne concrète à appliquer à la prochaine série, ou null si tout est correct",
  "resume": "une phrase, ou l'explication si la photo n'est pas analysable"
}

Mets "analysable": false, "points": [] et "conseil": null dans CHACUN de ces cas, sans exception :
- Le corps n'est pas entièrement visible, ou l'angle de prise de vue ne permet pas de juger
  la position (ex: de face alors que le mouvement se juge de profil).
- La photo est floue, sombre, ou capture une position intermédiaire non exploitable.
- Tu n'es pas certain de ce que tu observes.
Dans ces cas, "resume" explique en une phrase ce qui manque pour pouvoir analyser
(ex: "Filme-toi de profil, corps entier dans le cadre, en bas du mouvement.").

Règles impératives si "analysable": true :
- Ne signale QUE ce qui est réellement visible sur CETTE photo. N'évoque jamais l'erreur
  "classique" de cet exercice si elle n'apparaît pas ici : inventer un défaut ferait corriger
  une position déjà correcte, ce qui peut créer le problème plutôt que l'éviter.
- 3 points maximum, les plus importants pour la sécurité d'abord.
- "statut" vaut "a_surveiller" uniquement pour un écart réellement observable. Dans le doute,
  mets "ok" et n'en parle pas : un faux positif détruit la confiance dans l'outil.
- "conseil" reste UNE consigne actionnable immédiatement, formulée positivement
  (ex: "Pousse les genoux vers l'extérieur en montant"), jamais une liste.
- Aucun diagnostic médical, aucune mention de douleur, de pathologie, d'asymétrie
  structurelle ou de morphologie. Tu observes une position sur une photo, pas un corps.
- Si la charge semble lourde et la position dégradée, la consigne doit être de réduire la
  charge — jamais de "serrer les dents" ou de compenser.`;
}
