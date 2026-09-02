"use client";

import type { ReactNode } from "react";

export function ProgrammeCoverAction({
  targetId,
  label,
  children,
}: {
  targetId: string;
  label: string;
  children: ReactNode;
}) {
  function ouvrirProgramme() {
    const cible = document.getElementById(targetId);
    if (!cible) return;

    if (cible instanceof HTMLDetailsElement) cible.open = true;
    cible.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={ouvrirProgramme}
      aria-label={label}
      className="group/cover relative block aspect-[16/9] w-full cursor-pointer overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(196,154,82,.25),transparent_60%),#171b1d] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-laiton-300"
    >
      {children}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover/cover:bg-black/20 group-focus-visible/cover:bg-black/20">
        <span className="translate-y-2 rounded-full border border-white/25 bg-black/70 px-4 py-2 text-xs font-bold text-white opacity-0 shadow-lg backdrop-blur-sm transition group-hover/cover:translate-y-0 group-hover/cover:opacity-100 group-focus-visible/cover:translate-y-0 group-focus-visible/cover:opacity-100">
          {label} →
        </span>
      </span>
    </button>
  );
}
