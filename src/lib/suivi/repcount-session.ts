import type { SetSaisi } from "./historique-exercice";

export type ExerciceRepCount = { nom: string; sets: SetSaisi[] };

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
