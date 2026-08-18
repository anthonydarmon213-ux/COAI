"use client";

import { useEffect, useState } from "react";

// Jauge/anneau de progression réutilisable, avec une couleur sémantique
// fournie par la vue qui connaît la nature de l'indicateur.
export function Gauge({
  label,
  percent,
  sublabel,
  size = 120,
  color = "#c9a262",
  displayValue,
  sublabelColor,
}: {
  label: string;
  percent: number;
  sublabel?: string;
  size?: number;
  color?: string;
  displayValue?: string;
  sublabelColor?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayed(clamped);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(clamped * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [clamped]);

  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - displayed / 100);
  const intensity = 0.35 + (displayed / 100) * 0.65;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <div className="absolute inset-[18%] rounded-full blur-xl" style={{ backgroundColor: color, opacity: 0.09 }} aria-hidden="true" />
        <svg width={size} height={size} className="-rotate-90 motion-safe:animate-[spin_18s_linear_infinite]">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            stroke="#30363b"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
            style={{ opacity: intensity, filter: `drop-shadow(0 0 5px ${color}55)` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-2xl font-bold tracking-tight text-white">
            {displayValue ?? `${displayed}%`}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white">
          {label}
        </span>
        {sublabel && <span className="mt-0.5 text-[11px] font-medium text-[#8e969c]" style={sublabelColor ? { color: sublabelColor } : undefined}>{sublabel}</span>}
      </div>
    </div>
  );
}
