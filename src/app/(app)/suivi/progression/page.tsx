import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { Sparkline } from "@/components/suivi/sparkline";
import { MetricRing } from "@/components/suivi/metric-ring";
import { CoachingVisioCta } from "@/components/suivi/coaching-visio-cta";
import { getEffectivePlan } from "@/lib/subscription/plan";
import { Card } from "@/components/ui/card";
import { ShareProgressCardButton } from "@/components/suivi/share-progress-card-button";
import { Gauge } from "@/components/ui/gauge";
import { computeProfilCompletion } from "@/lib/profil/completion";

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
  const debutBilan = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const seancesDuMois = seances.filter((seance) => seance.date >= debutBilan).length;
  const frequenceHebdo = Number(user.profile?.frequenceEntrainement?.match(/\d+/)?.[0] ?? 2);
  const objectifMensuel = Math.max(4, frequenceHebdo * 4);
  const regularite = Math.min(100, Math.round((seancesDuMois / objectifMensuel) * 100));
  const profil = computeProfilCompletion(user.profile);
  const derniereMesure = mesures.at(-1);
  const champsMesures = derniereMesure
    ? [derniereMesure.poidsKg, derniereMesure.tourTailleCm, derniereMesure.masseGrassePourcent, derniereMesure.masseMusculaireKg, derniereMesure.frequenceCardiaqueReposBpm]
    : [];
  const suiviCorporel = champsMesures.length
    ? Math.round((champsMesures.filter((valeur) => valeur !== null).length / champsMesures.length) * 100)
    : 0;
  const recuperation = (() => {
    const sommeil = user.profile?.qualiteSommeil?.toLowerCase() ?? "";
    if (sommeil.includes("excellente")) return 95;
    if (sommeil.includes("bonne")) return 80;
    if (sommeil.includes("moyenne")) return 58;
    if (sommeil.includes("mauvaise")) return 32;
    return 0;
  })();

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Suivi</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Progression.</h1>
      </div>

      {seancesDuMois > 0 && (
        <Card className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <SectionLabel>Bilan des 30 derniers jours</SectionLabel>
            <p className="mt-2 text-sm text-graphite-300">
              {seancesDuMois} séance{seancesDuMois > 1 ? "s" : ""} réalisée{seancesDuMois > 1 ? "s" : ""}. Transforme ta régularité en carte COAI.
            </p>
          </div>
          <ShareProgressCardButton imageUrl="/api/suivi/bilan-mensuel/carte" filename="coai-bilan-30-jours.png" title="Mon bilan COAI" />
        </Card>
      )}

      <Card className="relative overflow-hidden border-laiton-400/20 bg-[radial-gradient(circle_at_50%_-20%,rgba(201,162,98,.16),transparent_48%),rgba(255,255,255,.025)]">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle,rgba(201,162,98,.55)_1px,transparent_1px)] [background-size:24px_24px]" aria-hidden="true" />
        <div className="relative">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionLabel>COAI Intelligence</SectionLabel>
              <h2 className="mt-2 font-display text-2xl text-white">Ta vue d’ensemble.</h2>
              <p className="mt-1 max-w-xl text-sm leading-6 text-graphite-400">Tes indicateurs évoluent avec tes séances, tes mesures et les informations que tu partages.</p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">Analyse personnalisée · 30 jours</span>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-7 sm:grid-cols-4">
            <Gauge label="Régularité" percent={regularite} sublabel={`${seancesDuMois}/${objectifMensuel} séances`} size={132} />
            <Gauge label="Profil COAI" percent={profil.pourcentage} sublabel="précision du profil" size={132} />
            <Gauge label="Suivi corporel" percent={suiviCorporel} sublabel={derniereMesure ? "dernière mesure" : "à activer"} size={132} />
            <Gauge label="Récupération" percent={recuperation} sublabel={recuperation ? "qualité déclarée" : "à renseigner"} size={132} />
          </div>
        </div>
      </Card>

      {graphiques.length === 0 && graphiquesForce.length === 0 ? (
        <Card className="text-center">
          <p className="font-semibold text-white">Tes courbes vont prendre vie ici.</p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-graphite-400">Ajoute une première mesure ou termine une séance : COAI commencera à révéler tes tendances, au-delà des quatre indicateurs déjà visibles.</p>
        </Card>
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
