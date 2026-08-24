"use client";

import { useState } from "react";

export function ProgrammeShareButton() {
  const [etat, setEtat] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function partager() {
    setEtat("loading");
    try {
      const response = await fetch("/api/programmes/carte-story");
      if (!response.ok) throw new Error("Carte indisponible");
      const blob = await response.blob();
      const file = new File([blob], "mon-programme-coai-story.png", { type: "image/png" });
      const text = "Mon programme COAI réunit entraînement, alimentation et récupération. Fais ton bilan offert sur coai.fr/diagnostic";

      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title: "Mon programme COAI", text, files: [file] });
        setEtat("idle");
        return;
      }
      const href = URL.createObjectURL(blob);
      window.open(href, "_blank", "noopener,noreferrer");
      if (navigator.clipboard) await navigator.clipboard.writeText(`${text} — https://coai.fr/diagnostic`);
      setEtat("done");
      window.setTimeout(() => setEtat("idle"), 3500);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setEtat("idle");
        return;
      }
      setEtat("error");
    }
  }

  return (
    <button
      type="button"
      onClick={partager}
      disabled={etat === "loading"}
      className="rounded-full border border-laiton-400/35 bg-laiton-400/[0.08] px-4 py-2 text-sm font-semibold text-laiton-200 transition hover:bg-laiton-400/[0.16]"
    >
      {etat === "loading" ? "Création de la Story…" : etat === "done" ? "Story ouverte ✓" : etat === "error" ? "Réessayer" : "Partager en Story"}
    </button>
  );
}
