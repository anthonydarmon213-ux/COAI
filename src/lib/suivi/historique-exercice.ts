export type SetSaisi = { reps: number; charge: number };

export type PerfExercice = {
  date: Date;
  sets: SetSaisi[];
  volume: number;
  meilleureSerie: SetSaisi | null;
};

type SeanceBrute = { date: string | Date; exercices: unknown };

function normaliser(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Retrouve toutes les fois où un exercice a été enregistré, du plus récent au
// plus ancien. Les séances stockent leurs exercices en JSON libre : on tolère
// donc une forme inattendue plutôt que de planter sur un historique ancien.
export function historiquePourExercice(seances: SeanceBrute[], nom: string): PerfExercice[] {
  const cible = normaliser(nom);
  if (!cible) return [];

  const perfs: PerfExercice[] = [];
  for (const seance of seances) {
    const liste = Array.isArray(seance.exercices) ? seance.exercices : [];
    for (const brut of liste) {
      if (!brut || typeof brut !== "object") continue;
      const ex = brut as { nom?: unknown; sets?: unknown };
      if (typeof ex.nom !== "string" || normaliser(ex.nom) !== cible) continue;

      const sets: SetSaisi[] = (Array.isArray(ex.sets) ? ex.sets : [])
        .map((s) => {
          const v = s as { reps?: unknown; charge?: unknown };
          return {
            reps: typeof v.reps === "number" ? v.reps : 0,
            charge: typeof v.charge === "number" ? v.charge : 0,
          };
        })
        .filter((s) => s.reps > 0);
      if (sets.length === 0) continue;

      const volume = sets.reduce((total, s) => total + s.reps * s.charge, 0);
      const meilleureSerie = sets.reduce<SetSaisi | null>(
        (best, s) => (!best || s.charge * s.reps > best.charge * best.reps ? s : best),
        null
      );
      perfs.push({ date: new Date(seance.date), sets, volume, meilleureSerie });
    }
  }
  return perfs.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export type Comparaison = {
  precedente: PerfExercice | null;
  ilYAUneSemaine: PerfExercice | null;
  deltaVolume: number | null;
};

// La séance de référence "il y a une semaine" est la plus proche de J-7 dans
// une fenêtre de quatre jours : personne ne s'entraîne exactement tous les
// sept jours, et exiger la date exacte ne trouverait presque jamais rien.
export function comparerAvantApres(
  perfs: PerfExercice[],
  maintenant: Date = new Date()
): Comparaison {
  const precedente = perfs[0] ?? null;
  const cible = maintenant.getTime() - 7 * 86400000;
  let ilYAUneSemaine: PerfExercice | null = null;
  let meilleurEcart = 4 * 86400000;

  for (const perf of perfs) {
    const ecart = Math.abs(perf.date.getTime() - cible);
    if (ecart <= meilleurEcart) {
      meilleurEcart = ecart;
      ilYAUneSemaine = perf;
    }
  }

  const deltaVolume =
    precedente && ilYAUneSemaine && ilYAUneSemaine !== precedente
      ? precedente.volume - ilYAUneSemaine.volume
      : null;

  return { precedente, ilYAUneSemaine, deltaVolume };
}
