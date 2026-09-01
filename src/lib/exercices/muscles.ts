// Correspondance exercice → groupes musculaires (22/08/2026, demande
// Anthony — cartographie anatomique du Live Player).
//
// Table écrite à la main, comme les variantes de substitution : les
// exercices sont générés par l'IA en texte libre, et deviner le muscle par
// mots-clés approximatifs afficherait un schéma faux. Un exercice non
// reconnu n'allume aucun muscle — la carte ne s'affiche alors pas du tout,
// plutôt qu'une silhouette éteinte qui laisserait croire à un bug.
//
// Les slugs correspondent exactement à ceux de react-muscle-highlighter
// (type Slug), pour que la carte s'allume sans traduction intermédiaire.
export type MuscleSlug =
  | "abs" | "adductors" | "biceps" | "calves" | "chest" | "deltoids"
  | "forearm" | "gluteal" | "hamstring" | "lower-back" | "obliques"
  | "quadriceps" | "trapezius" | "triceps" | "upper-back";

type Regle = { motifs: string[]; muscles: MuscleSlug[]; vue: "front" | "back" };

const REGLES: Regle[] = [
  // — Pectoraux / poussée horizontale
  { motifs: ["développé couché", "developpe couche", "bench press", "presse pectoraux", "chest press", "écarté", "ecarte", "fly", "pompe", "push-up", "push up", "dips"],
    muscles: ["chest", "triceps", "deltoids"], vue: "front" },
  // — Poussée verticale / épaules
  { motifs: ["développé militaire", "developpe militaire", "développé épaules", "shoulder press", "développé arnold", "pike push"],
    muscles: ["deltoids", "triceps", "trapezius"], vue: "front" },
  { motifs: ["élévation latérale", "elevation laterale", "lateral raise", "élévation frontale", "face pull", "rowing menton", "upright row"],
    muscles: ["deltoids", "trapezius"], vue: "front" },
  // — Tirage
  { motifs: ["traction", "pull-up", "pull up", "tirage vertical", "lat pulldown"],
    muscles: ["upper-back", "biceps", "forearm"], vue: "back" },
  { motifs: ["tirage horizontal", "rowing", "seated row", "row"],
    muscles: ["upper-back", "trapezius", "biceps"], vue: "back" },
  // — Bras
  { motifs: ["curl", "biceps"], muscles: ["biceps", "forearm"], vue: "front" },
  { motifs: ["triceps", "extension triceps", "pushdown", "skull"], muscles: ["triceps"], vue: "back" },
  // — Jambes
  { motifs: ["squat", "presse à cuisses", "presse a cuisses", "leg press", "hack squat", "fente", "lunge", "leg extension"],
    muscles: ["quadriceps", "gluteal", "adductors"], vue: "front" },
  { motifs: ["soulevé de terre", "souleve de terre", "deadlift", "romanian", "leg curl", "ischio", "good morning"],
    muscles: ["hamstring", "gluteal", "lower-back"], vue: "back" },
  { motifs: ["hip thrust", "pont fessier", "glute bridge", "kickback", "abduction"],
    muscles: ["gluteal", "hamstring"], vue: "back" },
  { motifs: ["mollet", "calf"], muscles: ["calves"], vue: "back" },
  // — Tronc
  { motifs: ["gainage", "planche", "plank", "crunch", "relevé de genoux", "releve de genoux", "relevé de jambes", "releve de jambes", "roue abdominale", "ab wheel", "sit-up"],
    muscles: ["abs"], vue: "front" },
  { motifs: ["russian twist", "oblique", "gainage latéral", "side plank"],
    muscles: ["obliques", "abs"], vue: "front" },
  { motifs: ["superman", "extension lombaire", "hyperextension"],
    muscles: ["lower-back", "gluteal"], vue: "back" },
];

export function musclesPourExercice(nom: string): { muscles: MuscleSlug[]; vue: "front" | "back" } | null {
  const normalise = nom.toLowerCase();
  // Première règle qui correspond : les règles sont ordonnées du plus
  // spécifique au plus général (ex. "développé militaire" avant "curl"),
  // pour qu'un nom composé ne tombe pas sur une règle trop large.
  const trouve = REGLES.find((r) => r.motifs.some((m) => normalise.includes(m)));
  return trouve ? { muscles: trouve.muscles, vue: trouve.vue } : null;
}

// Libellé lisible pour le badge "TARGET" — même ordre que les slugs.
export const MUSCLE_LABEL: Record<MuscleSlug, string> = {
  abs: "Abdos",
  adductors: "Adducteurs",
  biceps: "Biceps",
  calves: "Mollets",
  chest: "Pectoraux",
  deltoids: "Épaules",
  forearm: "Avant-bras",
  gluteal: "Fessiers",
  hamstring: "Ischios",
  "lower-back": "Lombaires",
  obliques: "Obliques",
  quadriceps: "Quadriceps",
  trapezius: "Trapèzes",
  triceps: "Triceps",
  "upper-back": "Dos",
};

// Exercices polyarticulaires (22/08/2026) — seuls concernés par le Motion
// Check : ce sont ceux où une position dégradée sous charge peut réellement
// blesser. Proposer une vérification de posture sur un curl biceps
// banaliserait la fonctionnalité sans rien apporter.
const MOTIFS_POLYARTICULAIRES = [
  "squat", "soulevé de terre", "souleve de terre", "deadlift", "romanian",
  "développé couché", "developpe couche", "bench press", "développé militaire",
  "developpe militaire", "shoulder press", "développé incliné", "developpe incline",
  "fente", "lunge", "traction", "pull-up", "pull up", "rowing", "dips",
  "hip thrust", "presse à cuisses", "presse a cuisses", "leg press", "clean", "thruster",
];

export function estPolyarticulaire(nom: string): boolean {
  const normalise = nom.toLowerCase();
  return MOTIFS_POLYARTICULAIRES.some((m) => normalise.includes(m));
}
