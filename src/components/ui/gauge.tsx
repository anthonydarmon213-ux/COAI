// Jauge/anneau de progression réutilisable (spec design system v2).
// Intensité rendue par variation d'opacité du brass — pas de code rouge/vert.
export function Gauge({
  label,
  percent,
  sublabel,
  size = 120,
}: {
  label: string;
  percent: number;
  sublabel?: string;
  size?: number;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const intensity = 0.35 + (clamped / 100) * 0.65;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-acier/50"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="text-brass transition-all drop-shadow-[0_0_4px_rgba(168,118,62,0.28)]"
            style={{ opacity: intensity }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xl font-semibold text-graphite-50">
            {Math.round(clamped)}%
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <span className="font-mono text-xs uppercase tracking-widest text-graphite-400">
          {label}
        </span>
        {sublabel && <span className="text-xs text-graphite-500">{sublabel}</span>}
      </div>
    </div>
  );
}
