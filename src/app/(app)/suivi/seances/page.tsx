import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SeanceForm } from "@/components/suivi/seance-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DOULEUR_LABEL: Record<string, string> = {
  LEGERE: "Douleur légère",
  IMPORTANTE: "Douleur importante",
};

type SerieRealisee = {
  repetitions?: number;
  chargeKg?: number;
  notes?: string;
};

type ExerciceJournal = {
  nom?: string;
  chargeKg?: number;
  repetitions?: number;
  sets?: SerieRealisee[];
};

export default async function SeancesPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const seances = await prisma.seanceLog.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 20,
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
      <SeanceForm />
      <div className="flex flex-col gap-2">
        {seances.map((s) => {
          const exercices = Array.isArray(s.exercices) ? (s.exercices as ExerciceJournal[]) : [];
          return (
            <Card key={s.id} className="flex flex-col gap-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-laiton-400">
                  {s.date.toISOString().slice(0, 10)}
                </span>
                <span className="rounded-full border border-white/[0.08] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-graphite-400">
                  {s.dureeMinutes ? `${s.dureeMinutes} min` : "Séance enregistrée"}
                </span>
              </div>
              {exercices.length > 0 && (
                <div className="grid gap-3">
                  {exercices.map((exercice, index) => {
                    const series = Array.isArray(exercice.sets) && exercice.sets.length > 0
                      ? exercice.sets
                      : typeof exercice.chargeKg === "number" || typeof exercice.repetitions === "number"
                        ? [{ chargeKg: exercice.chargeKg, repetitions: exercice.repetitions }]
                        : [];
                    return (
                      <div key={`${s.id}-${index}`} className="rounded-xl border border-white/[0.08] bg-black/15 p-3">
                        <h2 className="text-sm font-semibold text-white">{exercice.nom ?? "Exercice"}</h2>
                        {series.length > 0 ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {series.map((serie, seriesIndex) => (
                              <div
                                key={`${s.id}-${index}-${seriesIndex}`}
                                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2"
                              >
                                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-500">
                                  Série {String(seriesIndex + 1).padStart(2, "0")}
                                </span>
                                <span className="text-xs font-semibold text-white">
                                  {typeof serie.chargeKg === "number" ? `${serie.chargeKg} kg` : "— kg"} · {typeof serie.repetitions === "number" ? `${serie.repetitions} reps` : "— reps"}
                                </span>
                                {serie.notes ? <span className="w-full text-xs text-graphite-400">{serie.notes}</span> : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-graphite-400">Exercice enregistré.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {s.ressenti && <p className="text-sm text-graphite-300">{s.ressenti}</p>}
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
              {s.notes && <p className="text-graphite-400">{s.notes}</p>}
            </Card>
          );
        })}
        {seances.length === 0 && <p className="text-graphite-400">Aucune séance loguée.</p>}
      </div>
    </div>
  );
}
