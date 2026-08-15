// Logomark COAI. Arc plein doré (la main du coach, ouverte) qui entoure un
// œil bleu (iris + pupille + reflet) — la vigilance/l'attention du coach —
// lisible à toute taille, y compris en favicon. La variante "detailed"
// (anneau IA pointillé en plus) est réservée aux grands formats (brand
// book, hero) où le détail reste visible.
// Dégradés (au lieu d'aplats) sur l'arc et l'iris pour un rendu métal/pierre
// précieuse plus haut de gamme — demande d'Anthony du 10/08 ("mets en
// premium"). Chaque instance a ses propres ids de gradient (suffixés par un
// id unique) pour rester correcte si plusieurs <CoaiMark /> sont montés en
// même temps sur une page (les ids de <defs> SVG sont globaux au document).
"use client";

import { useEffect, useId, useState } from "react";

export function CoaiMark({
  size = 32,
  variant = "simple",
  animated = false,
  className,
}: {
  size?: number;
  variant?: "simple" | "detailed";
  animated?: boolean;
  className?: string;
}) {
  const uid = useId();
  const [isIn, setIsIn] = useState(!animated);
  const goldId = `coai-gold-${uid}`;
  const eyeId = `coai-eye-${uid}`;

  useEffect(() => {
    if (!animated) return;
    const frame = window.requestAnimationFrame(() => setIsIn(true));
    return () => window.cancelAnimationFrame(frame);
  }, [animated]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={[animated ? "coai-intro-mark" : "", isIn ? "in" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      <defs>
        <linearGradient id={goldId} x1="18" y1="14" x2="102" y2="106" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f6e6c4" />
          <stop offset="45%" stopColor="#c9a262" />
          <stop offset="100%" stopColor="#8a6a3a" />
        </linearGradient>
        <radialGradient id={eyeId} cx="35%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#6fb2d9" />
          <stop offset="55%" stopColor="#3d7a99" />
          <stop offset="100%" stopColor="#1f4a5e" />
        </radialGradient>
      </defs>
      <circle
        cx="60"
        cy="60"
        r="42"
        stroke={`url(#${goldId})`}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray="228 36"
        transform="rotate(-90 60 60)"
        className={animated ? "coai-intro-arc-human" : undefined}
      />
      {variant === "detailed" && (
        <circle className={animated ? "coai-intro-arc-ai" : undefined} cx="60" cy="60" r="24" stroke="#6b7078" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3.2 3.6" />
      )}
      <g className={animated ? "coai-intro-dot" : undefined}>
        <circle cx="60" cy="60" r="11" fill={`url(#${eyeId})`} />
        <circle cx="60" cy="60" r="5" fill="#0d1b22" />
        <circle cx="57" cy="57" r="1.8" fill="#eaf4f8" />
      </g>
    </svg>
  );
}
