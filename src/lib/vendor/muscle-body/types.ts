// Types repris de react-muscle-highlighter v1.2.0 (MIT) — voir ./LICENSE.

export type SlugCorps =
  | "abs" | "adductors" | "ankles" | "biceps" | "calves" | "chest" | "deltoids"
  | "feet" | "forearm" | "gluteal" | "hamstring" | "hands" | "hair" | "head"
  | "knees" | "lower-back" | "neck" | "obliques" | "quadriceps" | "tibialis"
  | "trapezius" | "triceps" | "upper-back";

export type PartieCorps = {
  color?: string;
  slug?: SlugCorps;
  path?: { common?: string[]; left?: string[]; right?: string[] };
};

export type PartieActive = PartieCorps & {
  intensity?: number;
  side?: "left" | "right";
};
