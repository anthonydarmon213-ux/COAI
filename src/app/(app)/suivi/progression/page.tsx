import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { Sparkline } from "@/components/suivi/sparkline";
import { MetricRing } from "@/components/suivi/metric-ring";
import { CoachingVisioCta } from "@/components/suivi/coaching-visio-cta";
import { getEffectivePlan } from "@/lib/subscription/plan";

type Metrique = {
  label: string;
  unite: string;
  valeurs: (m: {
    poidsKg: number | null;
    tourTailleCm: number | null;
    masseGrassePourcent: number | null;
    masseMusculaireKg: number | null;
    frequenceCardiaqueReposBpm: number | null;
  }) => number | null;
};

const METRIQUES: Metrique[] = [
  { label: "Poids", unite: "kg", valeurs: (m) => m.poidsKg },
  { label: "Masse grasse", unite: "%", valeurs: (m) => m.masseGrassePourcent },
  { label: "Masse musculaire", unite: "kg", valeurs: (m) => m.masseMusculaireKg },
  { label: "Tour de taille", unite: "cm", valeurs: (m) => m.tourTailleCm },
  { label: "Fréquence cardiaque de repos", unite: "bpm", valeurs: (m) => m.frequenceCardiaqueReposBpm },
];

export default async function ProgressionPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const [mesures, seances] = await Promise.all([
    prisma.mesure.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
    }),
    prisma.seanceLog.findMany({
      where: { userId: user.id },
      orderBy: { date: "asc" },
    }),
  ]);

  const graphiques = METRIQUES.map((metrique) => ({
    ...metrique,
    points: mesures.map(metrique.valeurs).filter((v): v is number => v !== null),
  })).filter((g) => g.points.length > 0);

  const chargesParExercice = new Map<string, number[]>();
  for (const seance of seances) {
    const exercices = Array.isArray(seance.exercices)
      ? (seance.exercices as { nom?: string; chargeKg?: number }[])
      : [];
    for (const ex of exercices) {
      if (!ex.nom || typeof ex.chargeKg !== "number") continue;
      const nom = ex.nom.trim();
      const liste = chargesParExercice.get(nom) ?? [];
      liste.push(ex.chargeKg);
      chargesParExercice.set(nom, liste);
    }
  }
  const graphiquesForce = Array.from(chargesParExercice.entries())
    .filter(([, points]) => points.length > 1)
    .map(([nom, points]) => ({ nom, points }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <SectionLabel>Suivi</SectionLabel>
        <h1 className="text-2xl font-semibold">Progression</h1>
      </div>

      {graphiques.length === 0 && graphiquesForce.length === 0 ? (
        <p className="text-graphite-400">
          Pas encore assez de données pour afficher une progression. Ajoute des mesures dans
          l&apos;onglet « Mesures » et des séances dans « Séances » (avec la charge utilisée).
        </p>
      ) : (
        <>
          {graphiquesForce.length > 0 && (
            <div className="flex flex-col gap-3">
              <SectionLabel>Force</SectionLabel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {graphiquesForce.map((g) => (
                  <Sparkline key={g.nom} label={g.nom} unite="kg" points={g.points} />
                ))}
              </div>
            </div>
          )}

          {graphiques.length > 0 && (
            <>
              <div className="flex flex-col gap-3">
                <SectionLabel>Aujourd&apos;hui</SectionLabel>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {graphiques.map((g) => {
                    const points = g.points;
                    const valeur = points.at(-1);
                    const precedente = points.length > 1 ? points.at(-2)! : null;
                    if (valeur === undefined) return null;
                    return (
                      <MetricRing
                        key={g.label}
                        label={g.label}
                        unite={g.unite}
                        valeur={valeur}
                        min={Math.min(...points)}
                        max={Math.max(...points)}
                        precedente={precedente}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <SectionLabel>Tendance</SectionLabel>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {graphiques.map((g) => (
                    <Sparkline key={g.label} label={g.label} unite={g.unite} points={g.points} />
                  ))}
                </div>
              </div>
            </>
          )}

          <CoachingVisioCta plan={getEffectivePlan(user.subscription)} />
        </>
      )}
    </div>
  );
}
