// Boucles animées par mouvement (23/08/2026, demande Anthony : "nos corps
// fluorescents avec les muscles qui travaillent, pas de vidéos YouTube où
// on sort du site").
//
// Le composant traite TOUS les exercices de la même façon : il demande une
// animation pour un nom, l'affiche si elle existe, retombe sinon sur le
// lien de démonstration. Ajouter un mouvement = déposer un MP4 dans
// public/animations/ et ajouter une ligne ici. Aucun composant à modifier.
//
// Les trois premiers clips viennent de la vidéo fournie par Anthony
// (squat, soulevé de terre haltères, pompe), découpée par segment et
// rognée en bas pour retirer les sous-titres de marque — ils parlaient du
// produit, pas du geste.
//
// Règle de prudence, identique à celle des photos et des variantes de
// matériel : un mouvement non reconnu n'affiche AUCUNE animation. Montrer
// un squat sur un curl biceps serait pire qu'un lien externe — ce serait
// un mauvais geste présenté avec l'apparence de l'exactitude.

export type AnimationExercice = {
  /** Fichier dans public/animations/, sans extension. */
  fichier: string;
  /** Ce que la boucle montre réellement — sert d'alt et de légende. */
  description: string;
};

type Entree = { motifs: string[]; animation: AnimationExercice };

const TABLE: Entree[] = [
  // CORRESPONDANCES STRICTES (23/08/2026, corrigé après signalement
  // d'Anthony : "press tu montres un squat, rowing tu montres un développé
  // épaule, il y a pas mal d'erreurs").
  //
  // Les motifs avaient été volontairement élargis pour faire monter la
  // couverture de 14 à 39 exercices — au prix de correspondances fausses :
  // "Extension triceps" affichait un curl (mouvement OPPOSÉ), "Superman" un
  // rowing, "Leg curl" un soulevé de terre, "Kickback" un pont fessier.
  //
  // Un clip ne s'affiche désormais que si c'est LE MÊME mouvement, pas une
  // famille approchante. Sur une démonstration technique, montrer le mauvais
  // geste est pire que ne rien montrer : la personne le reproduit avec une
  // charge. La couverture baisse, la justesse prime.

  {
    // Squat bilatéral debout uniquement — ni presse (assis/allongé), ni
    // fentes (unilatéral, tout autre équilibre).
    motifs: ["squat barre", "squat gobelet", "squat poids du corps", "bodyweight squat", "back squat"],
    animation: { fichier: "squat", description: "Squat, quadriceps et fessiers en action" },
  },
  {
    // Charnière de hanche jambes tendues. Le hip thrust est un mouvement de
    // pont, il a son propre clip ci-dessous.
    motifs: ["soulevé de terre", "souleve de terre", "deadlift", "romanian", "roumain"],
    animation: { fichier: "souleve-terre", description: "Soulevé de terre, chaîne postérieure sollicitée" },
  },
  {
    // Poussée horizontale. Les dips sont une poussée verticale au poids du
    // corps : mouvement et angle d'épaule différents, donc exclus.
    motifs: ["pompe", "push up", "push-up", "développé couché", "developpe couche", "bench press"],
    animation: { fichier: "pompe", description: "Poussée horizontale, pectoraux et triceps engagés" },
  },
  {
    // Traction verticale : poulie haute et traction partagent le même
    // schéma moteur.
    motifs: ["tirage vertical", "tirage poulie haute", "poulie haute", "lat pulldown", "traction", "pull up", "pull-up"],
    animation: { fichier: "tirage-vertical", description: "Tirage vertical, dorsaux et biceps sollicités" },
  },
  {
    // Tirage horizontal. "Rowing menton" est un upright row (épaules) :
    // exclu explicitement malgré le mot "rowing".
    motifs: ["tirage horizontal", "rowing haltère", "rowing haltere", "rowing élastique", "rowing elastique", "seated row", "tirage poulie basse"],
    animation: { fichier: "rowing-haltere", description: "Tirage horizontal, dos et arrière d'épaule engagés" },
  },
  {
    // Flexion de coude uniquement. Les extensions triceps sont le mouvement
    // inverse, les élévations et développés d'épaule un autre schéma.
    motifs: ["curl biceps", "curl marteau", "curl barre", "hammer curl", "bicep curl"],
    animation: { fichier: "curl-biceps", description: "Curl biceps, flexion de coude contrôlée" },
  },
  {
    // Poussée jambes assis/allongé — plus proche de la presse que le squat
    // debout ne l'était.
    motifs: ["presse à cuisses", "presse a cuisses", "leg press", "leg extension", "extension jambes"],
    animation: { fichier: "leg-extension", description: "Poussée des jambes assis, quadriceps en action" },
  },
  {
    // Extension de hanche en pont. Kickback et abduction sont des mouvements
    // distincts : exclus.
    motifs: ["pont fessier", "hip thrust", "glute bridge"],
    animation: { fichier: "pont-fessier", description: "Pont fessier, extension de hanche" },
  },
  {
    motifs: ["mollet", "calf", "marche sur pointes"],
    animation: { fichier: "mollets", description: "Extension des chevilles, mollets sollicités" },
  },
];

/**
 * Animation correspondant à un exercice, ou null si aucun clip fiable.
 * Le null est un résultat normal, pas une erreur : la fiche affiche alors
 * le lien de démonstration à la place.
 */
export function animationPourExercice(nom: string): AnimationExercice | null {
  const normalise = nom.toLowerCase();
  const entree = TABLE.find((e) => e.motifs.some((m) => normalise.includes(m)));
  return entree ? entree.animation : null;
}

export function urlAnimation(fichier: string): string {
  return `/animations/${fichier}.mp4`;
}
