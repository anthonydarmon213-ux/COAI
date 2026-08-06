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
    <div className="flex flex-col gap-5">
      {titre && (
        <h3 className="font-editorial text-2xl font-normal text-graphite-50">{titre}</h3>
      )}

      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <span
              key={i}
              className="rounded-full border border-laiton-400/25 bg-laiton-400/10 px-3 py-1 text-xs font-medium text-laiton-300"
            >
              {b.icone} {b.texte}
            </span>
          ))}
        </div>
      )}

      {vueEnsemble && (
        <div className="relative overflow-hidden rounded-2xl border border-laiton-400/20 bg-gradient-to-br from-laiton-400/[0.08] via-white/[0.02] to-transparent p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-laiton-400/10 blur-2xl" />
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-laiton-400">
            {vueEnsembleLabel}
          </span>
          <p className="mt-2 text-sm leading-6 text-graphite-100">{vueEnsemble}</p>
        </div>
      )}

      {jours.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {jours.map((jourData, i) => {
            const jourNom = String(jourData[jourKey] ?? `Jour ${i + 1}`);
            const label = labelJour ? labelJour(jourData, i) : jourNom;
            return (
              <details
                key={i}
                className="group overflow-hidden rounded-xl border border-graphite-800 bg-graphite-900/40 transition hover:border-laiton-400/30"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 p-4 marker:content-none">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-laiton-400/25 bg-laiton-400/10 font-mono text-[10px] font-semibold text-laiton-300">
                    {jourAbrege(jourNom)}
                  </span>
                  <span className="flex-1 text-sm font-medium text-graphite-50">{label}</span>
                  <span className="text-graphite-500 transition group-open:rotate-180">▾</span>
                </summary>
                <div className="flex flex-col gap-3 border-t border-graphite-800 p-4 pt-4">
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
