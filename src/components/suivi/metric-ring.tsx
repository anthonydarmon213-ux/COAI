import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export function MetricRing({
  label,
  unite,
  valeur,
  min,
  max,
  precedente,
}: {
  label: string;
  unite: string;
  valeur: number;
  min: number;
  max: number;
  precedente: number | null;
}) {
  const size = 132;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > min ? (valeur - min) / (max - min) : 0.5;
  const clamped = Math.min(1, Math.max(0, ratio));
  const offset = circumference * (1 - clamped);

  const delta = precedente !== null ? valeur - precedente : null;
  const deltaSign = delta !== null && delta !== 0 ? (delta > 0 ? "+" : "") : "";

  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <SectionLabel>{label}</SectionLabel>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-graphite-800"
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
            className="text-laiton-400 transition-all drop-shadow-[0_0_6px_rgba(201,162,98,0.55)]"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-semibold text-graphite-50">{valeur}</span>
          <span className="text-xs text-graphite-400">{unite}</span>
        </div>
      </div>
      {delta !== null && (
        <p className="text-xs text-graphite-400">
          <span className={delta === 0 ? "text-graphite-400" : "text-laiton-300"}>
            {deltaSign}
            {delta.toFixed(1)} {unite}
          </span>{" "}
          vs dernière mesure
        </p>
      )}
    </Card>
  );
}
