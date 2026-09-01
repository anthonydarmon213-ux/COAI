import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SeanceForm } from "@/components/suivi/seance-form";
import { EXERCICES } from "@/lib/exercices/catalogue";
import { exerciceAvecMediasCoai } from "@/lib/exercices/media-coai";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { Badge } from "@/components/ui/badge";

const DOULEUR_LABEL: Record<string, string> = {
  LEGERE: "Douleur légère",
  IMPORTANTE: "Douleur importante",
};

type SetDetail = { set?: number; reps?: number; charge?: number };
type ExerciceData = {
  nom?: string;
  series?: number;
  repetitions?: number;
  chargeKg?: number;
  sets?: SetDetail[];
};

function tonnageExercice(ex: ExerciceData): number {
  if (ex.sets && ex.sets.length > 0) {
    return ex.sets.reduce((sum, s) => sum + (s.reps ?? 0) * (s.charge ?? 0), 0);
  }
  const series = ex.series ?? 1;
  const reps = ex.repetitions ?? 0;
  const charge = ex.chargeKg ?? 0;
  return series * reps * charge;
}

export default async function SeancesPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const seances = await prisma.seanceLog.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 30,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Suivi</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Journal de séances.</h1>
      </div>
      <SeanceForm exercicesConnus={EXERCICES.filter((e) => exerciceAvecMediasCoai(e.nom)).map((e) => e.nom).sort((a, b) => a.localeCompare(b))} />
      <div className="flex flex-col gap-3">
        {seances.map((s) => {
          const exercices = Array.isArray(s.exercices)
            ? (s.exercices as ExerciceData[])
            : [];
          const tonnageTotal = exercices.reduce((sum, ex) => sum + tonnageExercice(ex), 0);

          return (
            <Card key={s.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-laiton-400">
                  {s.date.toISOString().slice(0, 10)}
                </span>
                <div className="flex gap-2">
                  {s.dureeMinutes && (
                    <Badge tone="neutral">{s.dureeMinutes} min</Badge>
                  )}
                  {tonnageTotal > 0 && (
                    <Badge tone="neutral">
                      {tonnageTotal >= 1000
                        ? `${(tonnageTotal / 1000).toFixed(1)}t`
                        : `${Math.round(tonnageTotal)} kg`}
                    </Badge>
                  )}
                </div>
              </div>

              {exercices.length > 0 && (
                <div className="flex flex-col gap-2">
                  {exercices.map((ex, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-graphite-50">
                          {ex.nom}
                        </span>
                        {ex.series && (
                          <span className="font-mono text-[10px] text-graphite-500">
                            {ex.series} série{ex.series > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {ex.sets && ex.sets.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ex.sets.map((set, j) => (
                            <span
                              key={j}
                              className="rounded-md border border-white/[0.08] bg-black/30 px-2 py-1 font-mono text-[11px] text-graphite-300"
                            >
                              {set.reps}×{set.charge}kg
                            </span>
                          ))}
                        </div>
                      ) : (
                        typeof ex.chargeKg === "number" && (
                          <p className="mt-1 font-mono text-xs text-graphite-400">
                            {ex.chargeKg} kg
                          </p>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}

              {(s.difficulte || s.energie || (s.douleur && s.douleur !== "AUCUNE")) && (
                <div className="flex flex-wrap gap-1.5">
                  {s.difficulte && <Badge tone="neutral">Difficulté {s.difficulte}/5</Badge>}
                  {s.energie && <Badge tone="neutral">Énergie {s.energie}/5</Badge>}
                  {s.douleur && s.douleur !== "AUCUNE" && (
                    <Badge tone={s.douleur === "IMPORTANTE" ? "danger" : "warning"}>
                      {DOULEUR_LABEL[s.douleur]}
                      {s.douleurZone ? ` — ${s.douleurZone}` : ""}
                    </Badge>
                  )}
                </div>
              )}
              {s.notes && <p className="text-xs text-graphite-400">{s.notes}</p>}
            </Card>
          );
        })}
        {seances.length === 0 && <p className="text-graphite-400">Aucune séance loguée.</p>}
      </div>
    </div>
  );
}
