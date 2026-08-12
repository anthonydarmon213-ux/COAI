"use client";

import { useState } from "react";

export function ShareProgressCardButton({ imageUrl, filename, title }: { imageUrl: string; filename: string; title: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function share() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Carte indisponible");
      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type || "image/png" });
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title, text: "Mon évolution avec COAI — coai.fr", files: [file] });
      } else {
        const href = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = href;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(href);
      }
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError("Impossible de partager pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button type="button" onClick={share} disabled={loading} className="rounded-lg border border-laiton-400/30 px-3 py-1.5 text-xs font-medium text-laiton-300 transition hover:border-laiton-400/60 hover:text-laiton-200 disabled:opacity-50">
        {loading ? "Création…" : "Partager →"}
      </button>
      {error && <span className="max-w-48 text-right text-[11px] text-red-400">{error}</span>}
    </div>
  );
}
