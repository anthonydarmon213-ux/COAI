import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export function Sparkline({
  label,
  points,
  unite,
}: {
  label: string;
  points: number[];
  unite: string;
}) {
  const width = 400;
  const height = 100;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const path = points
    .map((p, i) => {
      const x = points.length > 1 ? (i / (points.length - 1)) * width : width / 2;
      const y = height - ((p - min) / (max - min || 1)) * height;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const dernier = points[points.length - 1];

  return (
    <Card>
      <div className="mb-2 flex items-baseline justify-between">
        <SectionLabel>{label}</SectionLabel>
        <span className="font-mono text-sm text-graphite-200">
          {dernier} {unite}
        </span>
      </div>
      {points.length > 1 ? (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible text-laiton-400">
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_5px_rgba(201,162,98,0.5)]"
          />
        </svg>
      ) : (
        <p className="text-sm text-graphite-400">Pas encore assez de données.</p>
      )}
    </Card>
  );
}
