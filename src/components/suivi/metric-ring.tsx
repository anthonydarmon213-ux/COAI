import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export function MetricRing({
  label,
  unite,
  valeur,
  min,
  max,
  precedente,
  color = "#c9a262",
  variant = "ring",
}: {
  label: string;
  unite: string;
  valeur: number;
  min: number;
  max: number;
  precedente: number | null;
  color?: string;
  variant?: "ring" | "pie" | "bars";
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
  const visualPercent = unite === "%" ? Math.min(100, Math.max(0, valeur)) : Math.round(clamped * 100);

  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <SectionLabel>{label}</SectionLabel>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {variant === "pie" ? (
          <div
            className="absolute inset-0 rounded-full shadow-[0_14px_35px_-18px_currentColor]"
            style={{ color, background: `conic-gradient(${color} 0 ${visualPercent}%, rgba(255,255,255,.1) ${visualPercent}% 100%)` }}
          >
            <div className="absolute inset-[18%] rounded-full border border-white/10 bg-[#111518]/90 shadow-inner" />
          </div>
        ) : variant === "bars" ? (
          <div className="absolute inset-2 flex items-end justify-center gap-1.5 rounded-[1.7rem] border border-white/[0.08] bg-white/[0.04] px-5 pb-5 pt-4">
            {[38, 58, 48, 76, 64].map((height, index) => (
              <i key={height} className="w-3 rounded-full opacity-80" style={{ height: `${Math.max(18, height * (0.55 + visualPercent / 220))}%`, backgroundColor: index === 3 ? color : `${color}65` }} />
            ))}
          </div>
        ) : (
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
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
            className="transition-all"
            style={{ filter: `drop-shadow(0 0 5px ${color}55)` }}
          />
        </svg>
        )}
        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-2xl font-semibold text-graphite-50">{valeur}</span>
          <span className="font-mono text-xs text-graphite-400">{unite}</span>
        </div>
      </div>
      {delta !== null && (
        <p className="text-xs text-graphite-400">
          <span className={delta === 0 ? "text-graphite-400" : "font-semibold"} style={delta !== 0 ? { color } : undefined}>
            {deltaSign}
            {delta.toFixed(1)} {unite}
          </span>{" "}
          vs dernière mesure
        </p>
      )}
    </Card>
  );
}
