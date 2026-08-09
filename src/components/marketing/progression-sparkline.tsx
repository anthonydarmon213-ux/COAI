"use client";

import { useEffect, useRef, useState } from "react";

// Courbe de progression décorative — illustre le pilier "suivi", pas une
// donnée réelle : une seule série, pas de légende ni d'axes nécessaires.
// Se dessine à l'entrée dans le viewport (même logique que l'écran d'intro :
// une séquence qui se joue plutôt qu'un visuel statique), puis le point
// final pulse en continu pour garder une sensation de mouvement/direct.
export function ProgressionSparkline() {
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={ref}
      viewBox="0 0 200 64"
      className={`coai-sparkline h-16 w-full max-w-[13rem] ${visible ? "in" : ""}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="progression-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a262" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#c9a262" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        className="coai-sparkline-line"
        pathLength="1"
        d="M4 48 C 30 52, 45 38, 62 40 S 96 22, 116 24 S 150 6, 196 8"
        stroke="#c9a262"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        className="coai-sparkline-fill"
        d="M4 48 C 30 52, 45 38, 62 40 S 96 22, 116 24 S 150 6, 196 8 V 64 H 4 Z"
        fill="url(#progression-fill)"
      />
      <circle className="coai-sparkline-dot" cx="196" cy="8" r="3.5" fill="#c9a262" />
    </svg>
  );
}
