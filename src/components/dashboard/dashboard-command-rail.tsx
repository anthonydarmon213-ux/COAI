import { Activity, Database, ScanLine } from "lucide-react";

export function DashboardCommandRail({
  profil,
  readiness,
  seances,
}: {
  profil: number;
  readiness: number | null;
  seances: number;
}) {
  const signaux = [
    { label: "Profil compris", valeur: `${profil}%`, Icone: ScanLine, couleur: "cyan" },
    { label: "Signal du jour", valeur: readiness === null ? "À capter" : `${readiness}%`, Icone: Activity, couleur: "gold" },
    { label: "Mémoire 30 jours", valeur: `${seances} séance${seances > 1 ? "s" : ""}`, Icone: Database, couleur: "violet" },
  ] as const;

  return (
    <section className="coai-command-rail" aria-label="État de synchronisation COAI">
      <div className="coai-command-scan" aria-hidden="true" />
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-2.5 sm:px-5">
        <p className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-200">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.85)]" />
          COAI OS · synchronisé
        </p>
        <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-graphite-500">Une seule prochaine action utile</p>
      </div>
      <div className="relative grid grid-cols-3 divide-x divide-white/[0.07]">
        {signaux.map(({ label, valeur, Icone, couleur }) => (
          <div key={label} className="flex min-w-0 flex-col items-center gap-1 px-2 py-3 text-center sm:flex-row sm:justify-center sm:gap-3 sm:px-4 sm:text-left">
            <span className={`coai-command-icon coai-command-icon-${couleur}`}>
              <Icone size={15} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <strong className="block truncate text-xs font-semibold text-white sm:text-sm">{valeur}</strong>
              <span className="block truncate text-[8px] text-graphite-500 sm:text-[9px]">{label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
