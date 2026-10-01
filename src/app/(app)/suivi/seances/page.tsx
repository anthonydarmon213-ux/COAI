import { getCurrentAppUser } from "@/lib/auth/server";
import { AccessRecovery } from "@/components/auth/access-recovery";
import { workoutHistory } from "@/lib/suivi/workout-history";
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

type SetDetail = { set?: number; reps?: number; charge?: number; dureeSecondes?: number };
type ExerciceData = {
  nom?: string;
  series?: number;
  repetitions?: number;
  chargeKg?: number;
  sets?: SetDetail[];
};

// Historical JSON predates today's input validation. Do not let one damaged
// entry hide the entire journal, and never rewrite the stored workout here.
function journalDetails(value: unknown) {
  let incomplete = false;
  const record = (item: unknown): item is Record<string, unknown> =>
    item !== null && typeof item === "object" && !Array.isArray(item);
  function metric(item: unknown): number | undefined {
    if (item == null) return undefined;
    if (typeof item === "number" && Number.isFinite(item) && item >= 0) return item;
    incomplete = true;
    return undefined;
  }
  const exercices: ExerciceData[] = [];
  if (!Array.isArray(value)) return { exercices, incomplete: value != null, tonnage: 0 };
  for (const item of value) {
    if (!record(item) || typeof item.nom !== "string" || !item.nom.trim()) {
      incomplete = true;
      continue;
    }
    const ex: ExerciceData = { nom: item.nom, series: metric(item.series),
      repetitions: metric(item.repetitions), chargeKg: metric(item.chargeKg) };
    if (item.sets != null && !Array.isArray(item.sets)) incomplete = true;
    if (Array.isArray(item.sets)) {
      ex.sets = [];
      for (const raw of item.sets) {
        if (!record(raw)) { incomplete = true; continue; }
        const set = { reps: metric(raw.reps), charge: metric(raw.charge), dureeSecondes: metric(raw.dureeSecondes) };
        if (!Number.isFinite((set.reps ?? 0) * (set.charge ?? 0))) {
          incomplete = true;
          continue;
        }
        ex.sets.push(set);
      }
    }
    exercices.push(ex);
  }
  let tonnage = 0;
  for (const ex of exercices) {
    const amount = tonnageExercice(ex);
    if (Number.isFinite(amount) && Number.isFinite(tonnage + amount)) tonnage += amount;
    else incomplete = true;
  }
  return { exercices, incomplete, tonnage };
}

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
  if (!user) return <AccessRecovery />;

  const seances = await workoutHistory(user.id, { take: 30 });

  return (
    <div className="flex flex-col gap-6">
      <div className="coai-app-page-header animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Suivi</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Journal de séances.</h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-300 sm:text-base">
          Enregistre l’essentiel après ta séance. COAI transforme ensuite tes retours en ajustements utiles.
        </p>
      </div>
      <nav aria-label="Accès rapides au journal" className="flex flex-wrap gap-3">
        <a href="#saisir-seance" className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold">Saisir une séance</a>
        <a href="#historique-seances" className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold">Voir mon historique</a>
      </nav>
      <section aria-labelledby="saisir-seance">
      <h2 id="saisir-seance" tabIndex={-1} className="mb-4 scroll-mt-24 text-xl font-semibold">Saisir une séance</h2>
      <SeanceForm exercicesConnus={EXERCICES.filter((e) => exerciceAvecMediasCoai(e.nom)).map((e) => e.nom).sort((a, b) => a.localeCompare(b))} />
      </section>
      <section aria-labelledby="historique-seances" className="flex flex-col gap-3">
        <h2 id="historique-seances" tabIndex={-1} className="scroll-mt-24 text-xl font-semibold">Mon historique</h2>
        <p className="text-sm text-graphite-400">Tes 30 dernières séances enregistrées, de la plus récente à la plus ancienne.</p>
        {seances.map((s) => {
          const { exercices, incomplete, tonnage: tonnageTotal } = journalDetails(s.exercices);

          return (
            <Card key={s.id} className="coai-history-row flex flex-col gap-3 p-4">
              {incomplete && <p className="text-sm text-graphite-300">Certains détails de cette séance sont incomplets. Les mesures lisibles restent affichées ; le total peut être partiel.</p>}
              {s.dailySessionId && <div>
                <p className="text-sm font-semibold text-graphite-50">{s.dailyTitle}</p>
                <p className="mt-1 text-xs text-graphite-400">Séance quotidienne terminée · charges, répétitions et durée réalisées non renseignées.</p>
                {s.dailyRating && <p className="mt-2 text-sm">Ressenti : {s.dailyRating === "TROP_FACILE" ? "Trop facile" : s.dailyRating === "TROP_DURE" ? "Trop dure" : "Bien dosée"}</p>}
                {s.dailyPain != null && <p className="mt-1 text-sm">Douleur ou gêne signalée : {s.dailyPain ? "oui" : "non"}</p>}
              </div>}
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
                              {typeof set.dureeSecondes === "number" && set.dureeSecondes > 0
                                ? `${set.dureeSecondes} s de maintien`
                                : `${set.reps ?? "—"} × ${set.charge ?? "—"} kg`}
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
        {seances.length === 0 && <div className="coai-empty-state">Ta première séance terminée apparaîtra ici.</div>}
      </section>
    </div>
  );
}
