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
  {
    motifs: [
      "squat", "presse à cuisses", "presse a cuisses", "leg press",
      "hack squat", "fente", "lunge", "split squat", "chaise",
    ],
    animation: {
      fichier: "squat",
      description: "Flexion complète des jambes, quadriceps et fessiers en action",
    },
  },
  {
    motifs: [
      "soulevé de terre", "souleve de terre", "deadlift", "romanian",
      "hip thrust", "good morning", "ischio", "leg curl",
    ],
    animation: {
      fichier: "souleve-terre",
      description: "Charnière de hanche haltères, chaîne postérieure sollicitée",
    },
  },
  {
    motifs: [
      "pompe", "push up", "push-up", "développé couché", "developpe couche",
      "bench press", "chest press", "presse pectoraux", "dips",
    ],
    animation: {
      fichier: "pompe",
      description: "Poussée horizontale, pectoraux et triceps engagés",
    },
  },
  // Lot 2 (23/08/2026) — deuxième génération fournie par Anthony, même
  // style, 3 mouvements en 10 s (l'outil plafonne à cette durée).
  {
    motifs: [
      "tirage vertical", "tirage poulie haute", "poulie haute", "lat pulldown",
      "traction", "pull up", "pull-up", "tirage nuque",
    ],
    animation: {
      fichier: "tirage-vertical",
      description: "Tirage vertical assis, dorsaux et biceps sollicités",
    },
  },
  {
    motifs: [
      "rowing", "tirage horizontal", "tirage poulie basse", "poulie basse",
      "seated row", "row machine", "superman",
    ],
    animation: {
      fichier: "rowing-haltere",
      description: "Rowing haltère, dos et arrière d'épaule engagés",
    },
  },
  {
    motifs: [
      "curl", "biceps", "extension triceps", "triceps", "pushdown",
      "élévation", "elevation", "lateral raise", "développé militaire",
      "developpe militaire", "shoulder press", "arnold", "face pull",
      "rowing menton", "développé épaules", "developpe epaules",
    ],
    animation: {
      fichier: "curl-biceps",
      description: "Travail des bras et des épaules, charge contrôlée",
    },
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
