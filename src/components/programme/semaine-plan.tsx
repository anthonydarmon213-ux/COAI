import type { ReactNode } from "react";

// Coquille visuelle partagée par les 3 piliers (entraînement, nutrition,
// récupération) : vue d'ensemble de la semaine en avant, puis chaque jour
// replié par défaut (évite d'afficher tout le détail d'un coup — trop dense
// sinon avec le niveau de détail généré par jour).
function jourAbrege(jour: string): string {
  return jour.slice(0, 3).toUpperCase();
}

export function SemainePlan({
  titre,
  badges,
  vueEnsemble,
  vueEnsembleLabel = "✨ Plan de ta semaine",
  jours,
  jourKey = "jour",
  labelJour,
  renderContenu,
}: {
  titre?: string;
  badges?: { icone: string; texte: string }[];
  vueEnsemble?: string;
  vueEnsembleLabel?: string;
  jours: Record<string, unknown>[];
  jourKey?: string;
  labelJour?: (jour: Record<string, unknown>, i: number) => string;
  renderContenu: (jour: Record<string, unknown>, i: number) => ReactNode;
}) {
  return (
    <div className="coai-week-plan flex flex-col gap-5">
      {titre && (
        <h3 className="font-editorial text-2xl font-normal text-graphite-50">{titre}</h3>
      )}

      {badges && badges.length > 0 && (
        <div className="coai-week-badges flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <span
              key={i}
              className="coai-week-badge rounded-full border border-laiton-400/25 bg-laiton-400/10 px-3 py-1 text-xs font-medium text-laiton-300"
            >
              {b.icone} {b.texte}
            </span>
          ))}
        </div>
      )}

      {jours.length === 0 && vueEnsemble ? (
        <div className="coai-week-overview relative overflow-hidden rounded-2xl border border-laiton-400/20 bg-gradient-to-br from-laiton-400/[0.08] via-white/[0.02] to-transparent p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-laiton-400/10 blur-2xl" />
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-laiton-400">
            {vueEnsembleLabel}
          </span>
          <p className="mt-2 text-sm leading-6 text-graphite-100">{vueEnsemble}</p>
        </div>
      ) : null}

      {jours.length > 0 && (
        <div className="coai-week-days flex flex-col gap-2.5">
          {jours.map((jourData, i) => {
            const jourNom = String(jourData[jourKey] ?? `Jour ${i + 1}`);
            const label = labelJour ? labelJour(jourData, i) : jourNom;
            return (
              <details
                key={i}
                open={i === 0}
                className="coai-week-day group overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] transition duration-300 open:border-laiton-400/30 open:bg-white/[0.035] open:shadow-[0_0_0_1px_rgba(201,162,98,0.12),0_20px_50px_-30px_rgba(201,162,98,0.5)] hover:border-laiton-400/25"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3.5 p-4 marker:content-none">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-laiton-400/30 bg-laiton-400/[0.08] font-mono text-[10px] font-semibold tracking-wide text-laiton-300 transition duration-300 group-open:border-laiton-400/70 group-open:bg-laiton-400/15 group-open:text-laiton-200 group-open:shadow-[0_0_16px_-2px_rgba(201,162,98,0.55)]">
                    {jourAbrege(jourNom)}
                  </span>
                  <span className="flex-1 text-sm font-medium text-graphite-50">{label}</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-graphite-500 transition duration-300 group-open:rotate-180 group-open:border-laiton-400/30 group-open:text-laiton-400">
                    ▾
                  </span>
                </summary>
                <div className="flex flex-col gap-3 border-t border-white/[0.06] p-4 pt-4">
                  {renderContenu(jourData, i)}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
