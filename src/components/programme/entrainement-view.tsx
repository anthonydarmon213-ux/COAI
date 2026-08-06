import { JsonView } from "@/components/programme/json-view";
import { ExerciceCard } from "@/components/programme/exercice-card";

// Vue dédiée au pilier ENTRAÎNEMENT : met en avant la vue d'ensemble de la
// semaine, puis replie chaque séance (fermée par défaut) pour éviter
// d'afficher tout le détail (échauffement + exercices) d'un coup — trop
// dense sinon avec le niveau de détail désormais généré par séance.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jourAbrege(jour: string): string {
  return jour.slice(0, 3).toUpperCase();
}

export function EntrainementView({ data }: { data: unknown }) {
  if (!isPlainObject(data)) return <JsonView data={data} typeMedia="exercice" />;

  const { titre, frequenceParSemaine, dureeProgramme, vueEnsemble, seances, ...reste } = data as {
    titre?: string;
    frequenceParSemaine?: string;
    dureeProgramme?: string;
    vueEnsemble?: string;
    seances?: unknown[];
    [key: string]: unknown;
  };

  return (
    <div className="flex flex-col gap-5">
      {titre && (
        <h3 className="font-editorial text-2xl font-normal text-graphite-50">{String(titre)}</h3>
      )}

      {(frequenceParSemaine || dureeProgramme) && (
        <div className="flex flex-wrap gap-2">
          {frequenceParSemaine && (
            <span className="rounded-full border border-laiton-400/25 bg-laiton-400/10 px-3 py-1 text-xs font-medium text-laiton-300">
              📅 {String(frequenceParSemaine)}
            </span>
          )}
          {dureeProgramme && (
            <span className="rounded-full border border-graphite-700 bg-graphite-900 px-3 py-1 text-xs text-graphite-300">
              ⏳ {String(dureeProgramme)}
            </span>
          )}
        </div>
      )}

      {vueEnsemble && (
        <div className="relative overflow-hidden rounded-2xl border border-laiton-400/20 bg-gradient-to-br from-laiton-400/[0.08] via-white/[0.02] to-transparent p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-laiton-400/10 blur-2xl" />
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-laiton-400">
            ✨ Plan de ta semaine
          </span>
          <p className="mt-2 text-sm leading-6 text-graphite-100">{String(vueEnsemble)}</p>
        </div>
      )}

      {Array.isArray(seances) && (
        <div className="flex flex-col gap-2.5">
          {seances.map((seance, i) => {
            if (!isPlainObject(seance)) return null;
            const { jour, nom, echauffement, exercices, ...detailSeance } = seance as {
              jour?: string;
              nom?: string;
              echauffement?: string;
              exercices?: unknown[];
              [key: string]: unknown;
            };
            return (
              <details
                key={i}
                className="group overflow-hidden rounded-xl border border-graphite-800 bg-graphite-900/40 transition hover:border-laiton-400/30"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 marker:content-none">
                  {jour && (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-laiton-400/25 bg-laiton-400/10 font-mono text-[10px] font-semibold text-laiton-300">
                      {jourAbrege(String(jour))}
                    </span>
                  )}
                  <span className="flex-1 text-sm font-medium text-graphite-50">
                    {nom ? String(nom) : `Séance ${i + 1}`}
                  </span>
                  <span className="text-graphite-500 transition group-open:rotate-180">▾</span>
                </summary>
                <div className="flex flex-col gap-3 border-t border-graphite-800 p-4 pt-4">
                  {echauffement && (
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-graphite-500">
                        🔥 Échauffement
                      </span>
                      <p className="mt-1 text-xs leading-5 text-graphite-300">
                        {String(echauffement)}
                      </p>
                    </div>
                  )}
                  {Array.isArray(exercices) && exercices.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {exercices.map((exercice, j) => (
                        <ExerciceCard key={j} exercice={exercice} />
                      ))}
                    </div>
                  )}
                  {Object.keys(detailSeance).length > 0 && (
                    <JsonView data={detailSeance} typeMedia="exercice" />
                  )}
                </div>
              </details>
            );
          })}
        </div>
      )}

      {Object.keys(reste).length > 0 && <JsonView data={reste} typeMedia="exercice" />}
    </div>
  );
}
