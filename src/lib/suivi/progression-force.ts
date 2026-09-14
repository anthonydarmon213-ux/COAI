/** Input sessions must be chronological. Preserve exact exercise variants. */
export function progressionForce(seances: { exercices: unknown }[]): Map<string, number[]> {
  const resultat = new Map<string, number[]>();
  for (const seance of seances) {
    const maxima = new Map<string, number>();
    if (!Array.isArray(seance.exercices)) continue;
    for (const ex of seance.exercices) {
      if (!ex || typeof ex !== "object" || typeof ex.nom !== "string" || !ex.nom.trim()) continue;
      let maximum: number | null = null;
      if (Array.isArray(ex.sets) && ex.sets.length > 0) {
        for (const serie of ex.sets) {
          if (!serie || typeof serie !== "object") continue;
          if (typeof serie.reps !== "number" || !Number.isFinite(serie.reps) || serie.reps <= 0) continue;
          if (typeof serie.charge !== "number" || !Number.isFinite(serie.charge) || serie.charge <= 0) continue;
          maximum = Math.max(maximum ?? 0, serie.charge);
        }
      } else if (typeof ex.chargeKg === "number" && Number.isFinite(ex.chargeKg) && ex.chargeKg > 0) {
        maximum = ex.chargeKg;
      }
      if (maximum === null) continue;
      const nom = ex.nom.trim();
      maxima.set(nom, Math.max(maxima.get(nom) ?? 0, maximum));
    }
    for (const [nom, maximum] of maxima) {
      const points = resultat.get(nom) ?? [];
      points.push(maximum);
      resultat.set(nom, points);
    }
  }
  return resultat;
}
