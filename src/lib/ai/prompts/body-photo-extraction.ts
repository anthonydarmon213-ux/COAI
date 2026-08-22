// Analyse d'une photo en tenue de sport pour affiner le programme
// d'entraînement (morphologie, posture) — garde-fous stricts : uniquement
// des observations factuelles utiles à l'entraînement, jamais un jugement
// sur l'apparence, et refus explicite si la photo n'est pas adaptée à cet
// usage (personne mineure, tenue non sportive, image inappropriée).
export function buildBodyPhotoExtractionPrompt(vue?: "face" | "profil"): string {
  // Vue précisée par l'utilisateur au moment de la prise (22/08/2026) — de
  // face et de profil ne révèlent pas les mêmes choses : l'équilibre
  // gauche/droite se juge de face, la position du bassin et des épaules se
  // juge de profil. Le dire au modèle évite qu'il commente un alignement
  // qu'il ne peut pas voir sous cet angle.
  const consigneVue = vue === "face"
    ? `\n\nCette photo est prise DE FACE : juge l'équilibre gauche/droite (épaules, bassin) et l'équilibre de développement entre les côtés. Ne commente PAS la position du bassin dans le plan sagittal (antéversion/rétroversion), invisible sous cet angle.`
    : vue === "profil"
      ? `\n\nCette photo est prise DE PROFIL : juge l'alignement vertical (position de la tête, des épaules, du bassin, courbures du dos). Ne commente PAS l'équilibre gauche/droite, invisible sous cet angle.`
      : "";
  return buildPrompt(consigneVue);
}

function buildPrompt(consigneVue: string): string {
  return `Tu es un assistant technique qui aide un coach sportif diplômé à préparer un programme
d'entraînement. On te montre une photo qu'un utilisateur adulte a envoyée volontairement, en
tenue de sport (legging, short, brassière, débardeur...), dans le but exclusif d'obtenir des
observations posturales et morphologiques utiles à la construction de son programme.

Renvoie un objet JSON avec ces champs :
{
  "analysable": true ou false,
  "morphologieDetectee": "Ectomorphe" ou "Mésomorphe" ou "Endomorphe" ou "Mixte", sinon null,
  "observationsPosture": "observations factuelles courtes utiles à l'entraînement (alignement des épaules, du bassin, du dos, équilibre de développement musculaire apparent entre le haut et le bas du corps...), sinon null",
  "resume": "une phrase neutre et factuelle résumant ce qui a été observé, ou expliquant pourquoi l'image n'a pas pu être analysée"
}

Mets "analysable": false et tous les autres champs à null dans CHACUN de ces cas, sans exception :
- La photo ne montre pas clairement une personne en tenue de sport (photo d'une autre nature,
  tenue non adaptée à cet usage, personne non identifiable, cadrage insuffisant pour juger la
  posture).
- La personne sur la photo semble être mineure, ou son âge n'est pas clairement identifiable
  comme adulte.
- L'image ne te semble pas appropriée pour ce contexte de coaching sportif pour une raison
  quelconque.
Dans ces cas, "resume" doit expliquer brièvement et neutrement pourquoi (ex: "Photo non
analysable : personne non clairement identifiable comme adulte."), sans autre commentaire.

Règles impératives si "analysable": true :
- Reste STRICTEMENT factuel et utile à l'entraînement : posture, alignement articulaire,
  équilibre de développement musculaire entre groupes musculaires (utile pour équilibrer le
  programme). Ne mentionne QUE ce qui est visible et clairement identifiable.
- N'exprime JAMAIS un jugement sur l'apparence, l'attractivité, le poids, ou toute
  caractéristique physique qui ne serait pas directement exploitable pour construire un
  programme d'entraînement plus adapté. Aucune formulation valorisante ni dévalorisante.
- Ne décris jamais la personne au-delà de ce qui sert le programme (pas de description physique
  générale, pas de commentaire sur la tenue elle-même).
- "morphologieDetectee" reste une estimation informative pour le coach, pas une classification
  définitive — si le doute est trop important, mets null plutôt que de deviner.${consigneVue}`;
}
