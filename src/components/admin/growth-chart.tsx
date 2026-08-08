"use client";

import { useId } from "react";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export function GrowthChart({
  label,
  points,
}: {
  label: string;
  points: { periode: string; valeur: number }[];
}) {
  const gradientId = useId();
  const width = 800;
  const height = 160;
  const values = points.map((p) => p.valeur);
  const max = Math.max(...values, 1);
  const path = points
    .map((p, i) => {
      const x = points.length > 1 ? (i / (points.length - 1)) * width : width / 2;
      const y = height - (p.valeur / max) * height;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  const dernier = values[values.length - 1] ?? 0;

  return (
    <Card>
      <div className="mb-3 flex items-baseline justify-between">
        <SectionLabel>{label}</SectionLabel>
        <span className="font-mono text-sm text-graphite-200">{dernier} au total</span>
      </div>
      {points.length > 1 && max > 0 ? (
        <>
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible text-laiton-400">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} stroke="none" />
            <path
              d={path}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_3px_rgba(201,162,98,0.25)]"
            />
          </svg>
          <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-widest text-graphite-500">
            <span>{points[0]?.periode}</span>
            <span>{points[points.length - 1]?.periode}</span>
          </div>
        </>
      ) : (
        <p className="text-sm text-graphite-400">Pas encore assez de données.</p>
      )}
    </Card>
  );
}
