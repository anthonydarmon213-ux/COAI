"use client";

import { useState } from "react";

export function ProgrammeShareButton({ pilier }: { pilier: string }) {
  const [copie, setCopie] = useState(false);

  async function partager() {
    const title = `Mon programme COAI — ${pilier}`;
    const text = `Je progresse avec mon programme ${pilier.toLowerCase()} COAI : entraînement, nutrition et récupération réunis. Fais ton bilan offert sur coai.fr`;
    const url = "https://coai.fr";

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} — ${url}`);
      setCopie(true);
      window.setTimeout(() => setCopie(false), 2000);
    } catch (error) {
      // L'annulation volontaire de la feuille de partage n'est pas une
      // erreur à afficher à l'utilisateur.
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  return (
    <button
      type="button"
      onClick={partager}
      className="rounded-full border border-laiton-400/35 bg-laiton-400/[0.08] px-4 py-2 text-sm font-semibold text-laiton-200 transition hover:bg-laiton-400/[0.16]"
    >
      {copie ? "Lien copié ✓" : "Partager"}
    </button>
  );
}
