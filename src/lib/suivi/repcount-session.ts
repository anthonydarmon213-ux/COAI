import type { SetSaisi } from "./historique-exercice";

export type ExerciceRepCount = { nom: string; sets: SetSaisi[] };

/** A reusable sequence contains names only, never previously completed sets. */
export function nomsSeance(exercices: unknown): string[] {
  if (!Array.isArray(exercices)) return [];
  const noms: string[] = [];
  for (const exercice of exercices.slice(0, 100)) {
    if (!exercice || typeof exercice !== "object" || typeof exercice.nom !== "string") continue;
    const nom = exercice.nom.trim();
    if (nom && nom.length <= 200 && !noms.includes(nom)) noms.push(nom);
  }
  return noms;
}

/** Keep exact exercise names: never merge different equipment or variants. */
export function assemblerSeance(exercices: ExerciceRepCount[], nom: string, sets: SetSaisi[]): ExerciceRepCount[] {
  const resultat = exercices.map(exercice => ({ nom: exercice.nom, sets: exercice.sets.map(serie => ({ ...serie })) }));
  if (!sets.length || !nom.trim()) return resultat;
  const existant = resultat.find(exercice => exercice.nom === nom.trim());
  if (existant) existant.sets.push(...sets.map(serie => ({ ...serie })));
  else resultat.push({ nom: nom.trim(), sets: sets.map(serie => ({ ...serie })) });
  return resultat;
}

export function payloadSeance(exercices: ExerciceRepCount[]) {
  return exercices.map(exercice => ({ ...exercice, sets: exercice.sets.map((serie, index) => ({ ...serie, set: index + 1 })) }));
}
