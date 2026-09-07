import Link from "next/link";
import {
  Activity,
  Crosshair,
  Dumbbell,
  Move3d,
  ScanLine,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { RepereCapitalPhysique } from "@/lib/insight/capital-physique";

const ICONE: Record<RepereCapitalPhysique["id"], LucideIcon> = {
  force: Dumbbell,
  mobilite: Move3d,
  equilibre: Waves,
  coordination: Crosshair,
  endurance: Activity,
  posture: ScanLine,
};

const POINTS = [
  [100, 22],
  [168, 61],
  [168, 139],
  [100, 178],
  [32, 139],
  [32, 61],
] as const;

function pointsPolygone(reperes: RepereCapitalPhysique[]) {
  return reperes
    .map((repere, index) => {
      const [x, y] = POINTS[index]!;
      const couverture = repere.statut === "MESURE" ? 0.9 : repere.statut === "A_OBSERVER" ? 0.52 : 0.34;
      return `${100 + (x - 100) * couverture},${100 + (y - 100) * couverture}`;
    })
    .join(" ");
}

export function CapitalPhysiqueCard({
  reperes,
  nombreMesures,
}: {
  reperes: RepereCapitalPhysique[];
  nombreMesures: number;
}) {
  const complet = nombreMesures === reperes.length;

  return (
    <section
      className="animate-reveal relative overflow-hidden rounded-[1.75rem] border border-cyan-300/20 bg-[radial-gradient(circle_at_18%_42%,rgba(34,211,238,.13),transparent_31%),linear-gradient(135deg,rgba(2,15,22,.96),rgba(16,16,18,.94)_56%,rgba(201,162,98,.08))] p-6 shadow-[0_28px_90px_-60px_rgba(34,211,238,.85)] sm:p-8"
      aria-labelledby="capital-physique-title"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-laiton-300/10 shadow-[0_0_90px_rgba(201,162,98,.08)]" />

      <div className="relative flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(18rem,.82fr)_minmax(0,1.18fr)] xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">
              Signature COAI
            </p>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-100">
              {nombreMesures}/6 repères posés
            </span>
          </div>
          <h2 id="capital-physique-title" className="mt-3 font-editorial text-4xl font-normal text-white sm:text-5xl">
            Ton Capital Physique.
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-graphite-300">
            Force, mobilité, équilibre, coordination, endurance et posture : COAI construit une vision utile de ton corps, puis fait évoluer ton programme avec toi.
          </p>

          <div className="relative mx-auto mt-7 aspect-square w-full max-w-[18rem]" aria-label={`Cartographie complétée sur ${nombreMesures} qualités physiques sur 6`}>
            <div aria-hidden="true" className="absolute inset-[13%] animate-pulse rounded-full bg-cyan-300/[0.045] blur-xl" />
            <svg viewBox="0 0 200 200" className="relative h-full w-full overflow-visible" role="img" aria-hidden="true">
              <defs>
                <linearGradient id="capital-fill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#67e8f9" stopOpacity=".45" />
                  <stop offset="1" stopColor="#f3cf78" stopOpacity=".28" />
                </linearGradient>
                <filter id="capital-glow">
                  <feGaussianBlur stdDeviation="2.4" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              {[1, 0.72, 0.43].map((scale) => (
                <polygon
                  key={scale}
                  points={POINTS.map(([x, y]) => `${100 + (x - 100) * scale},${100 + (y - 100) * scale}`).join(" ")}
                  fill="none"
                  stroke={scale === 1 ? "rgba(103,232,249,.27)" : "rgba(255,255,255,.09)"}
                  strokeWidth="1"
                />
              ))}
              {POINTS.map(([x, y]) => <line key={`${x}-${y}`} x1="100" y1="100" x2={x} y2={y} stroke="rgba(255,255,255,.07)" />)}
              <polygon points={pointsPolygone(reperes)} fill="url(#capital-fill)" stroke="#67e8f9" strokeWidth="1.5" filter="url(#capital-glow)" />
              {reperes.map((repere, index) => {
                const [x, y] = POINTS[index]!;
                const couverture = repere.statut === "MESURE" ? 0.9 : repere.statut === "A_OBSERVER" ? 0.52 : 0.34;
                return <circle key={repere.id} cx={100 + (x - 100) * couverture} cy={100 + (y - 100) * couverture} r="2.8" fill={repere.statut === "MESURE" ? "#f3cf78" : "#67e8f9"} />;
              })}
              <circle cx="100" cy="100" r="24" fill="#080d11" stroke="rgba(243,207,120,.38)" />
              <text x="100" y="98" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="700">{nombreMesures}/6</text>
              <text x="100" y="112" textAnchor="middle" fill="#9ca3af" fontSize="6" letterSpacing="1.2">REPÈRES</text>
            </svg>
            <p className="mt-1 text-center text-[10px] leading-4 text-graphite-500">
              La forme montre la couverture de ton suivi, pas une note médicale.
            </p>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {reperes.map((repere) => {
              const Icone = ICONE[repere.id];
              const mesure = repere.statut === "MESURE";
              return (
                <div key={repere.id} className={`group flex min-h-[5.7rem] items-center gap-3 rounded-2xl border p-3.5 transition hover:-translate-y-0.5 ${mesure ? "border-laiton-300/20 bg-laiton-300/[0.055]" : "border-white/[0.08] bg-white/[0.025]"}`}>
                  <span className={`grid h-10 w-10 flex-none place-items-center rounded-full border ${mesure ? "border-laiton-300/30 bg-laiton-300/10 text-laiton-200" : "border-cyan-300/15 bg-cyan-300/[0.06] text-cyan-200"}`}>
                    <Icone size={18} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{repere.label}</h3>
                      <span className={`h-1.5 w-1.5 rounded-full ${mesure ? "bg-emerald-300 shadow-[0_0_9px_rgba(110,231,183,.8)]" : "bg-graphite-600"}`} />
                    </div>
                    <p className="mt-1 truncate text-[11px] text-graphite-400">{repere.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-laiton-200">
              {complet ? "Cartographie complète" : "Prochaine étape recommandée"}
            </p>
            <p className="mt-1.5 text-sm leading-6 text-graphite-200">
              {complet
                ? "Continue à enregistrer tes résultats : COAI transforme chaque nouveau repère en trajectoire de progression."
                : "Pose les repères manquants pour rendre ton accompagnement encore plus précis et suivre ce qui progresse vraiment."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link href="/suivi/tests-maxi" className="inline-flex min-h-11 items-center justify-center rounded-full bg-laiton-300 px-5 py-2.5 text-xs font-bold text-graphite-950 transition hover:-translate-y-0.5 hover:bg-laiton-200">
                {nombreMesures > 0 ? "Compléter mes repères →" : "Commencer ma cartographie →"}
              </Link>
              <Link href="/suivi/progression" className="inline-flex min-h-11 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/[0.06] px-5 py-2.5 text-xs font-bold text-cyan-100 transition hover:bg-cyan-300/[0.12]">
                Voir ma progression
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
