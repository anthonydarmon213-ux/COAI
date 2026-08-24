"use client";

import { useState } from "react";

export function ProgrammePdfButton({ slug, label = "Fiche PDF" }: { slug: string; label?: string }) {
  const [etat, setEtat] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function telecharger() {
    setEtat("loading");
    try {
      const response = await fetch(`/api/programmes/${slug}/pdf`);
      if (!response.ok) throw new Error("PDF indisponible");
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const lien = document.createElement("a");
      lien.href = href;
      lien.download = `coai-${slug}.pdf`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1_000);
      setEtat("done");
      window.setTimeout(() => setEtat("idle"), 3_000);
    } catch {
      setEtat("error");
    }
  }

  return (
    <button
      type="button"
      onClick={telecharger}
      disabled={etat === "loading"}
      className="rounded-full border border-graphite-800 px-4 py-2 text-sm text-graphite-300 transition hover:border-laiton-400/40 hover:text-white disabled:opacity-60"
    >
      {etat === "loading" ? "Préparation…" : etat === "done" ? "Téléchargé ✓" : etat === "error" ? "Réessayer" : label}
    </button>
  );
}
