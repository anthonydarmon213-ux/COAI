import { musclesPourExercice, type MuscleSlug } from "@/lib/exercices/muscles";

// Volume travaillé par zone musculaire sur une période (01/09/2026).
//
// Le tonnage d'un exercice est réparti sur les muscles qu'il sollicite, à
// parts égales. C'est volontairement grossier : pondérer finement
// (« le squat, c'est 60 % quadriceps, 25 % fessiers… ») donnerait une fausse
// impression de précision biomécanique que ces données ne portent pas.
// L'objectif est de montrer ce qui est négligé, pas de mesurer.

export type SetEnregistre = { reps?: number; charge?: number };
export type ExerciceEnregistre = { nom?: string; sets?: SetEnregistre[]; series?: number };
export type SeanceEnregistree = { date: Date; exercices: unknown };

export type VolumeParMuscle = {
  volumes: Partial<Record<MuscleSlug, number>>;
  intensites: Partial<Record<MuscleSlug, number>>;
  total: number;
  nbSeances: number;
};

function nombrePositif(value: unknown): number {
  if (typeof value !== "number" && typeof value !== "string") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function volumeParMuscle(seances: SeanceEnregistree[], joursFenetre = 30): VolumeParMuscle {
  const depuis = new Date();
  depuis.setDate(depuis.getDate() - joursFenetre);

  const volumes: Partial<Record<MuscleSlug, number>> = {};
  let total = 0;
  let nbSeances = 0;

  for (const seance of seances) {
    if (seance.date < depuis) continue;
    if (!Array.isArray(seance.exercices)) continue;
    nbSeances += 1;

    for (const brut of seance.exercices as ExerciceEnregistre[]) {
      if (!brut || typeof brut.nom !== "string") continue;
      const cible = musclesPourExercice(brut.nom);
      if (!cible || cible.muscles.length === 0) continue;

      // Tonnage réel quand les séries sont détaillées. Sinon on retombe sur
      // le nombre de séries : une séance au poids du corps ou saisie sans
      // charge compte quand même, sans quoi elle disparaîtrait du bilan.
      const sets = Array.isArray(brut.sets) ? brut.sets : [];
      const tonnage = sets.reduce((t, s) => {
        const suivant = t + nombrePositif(s?.reps) * nombrePositif(s?.charge);
        return Number.isFinite(suivant) ? suivant : t;
      }, 0);
      const poids = tonnage > 0 ? tonnage : (nombrePositif(brut.series) || sets.length || 1) * 10;
      // Une valeur historique extrême ne doit pas rendre toute la carte NaN.
      if (!Number.isFinite(poids) || !Number.isFinite(total + poids)) continue;

      const part = poids / cible.muscles.length;
      for (const m of cible.muscles) {
        volumes[m] = (volumes[m] ?? 0) + part;
      }
      total += poids;
    }
  }

  // Normalisation sur le muscle le plus travaillé : l'échelle est relative à
  // la personne, pas à une norme extérieure qui n'existe pas.
  const max = Math.max(0, ...Object.values(volumes));
  const intensites: Partial<Record<MuscleSlug, number>> = {};
  if (max > 0) {
    for (const [m, v] of Object.entries(volumes)) {
      intensites[m as MuscleSlug] = (v ?? 0) / max;
    }
  }

  return { volumes, intensites, total, nbSeances };
}
