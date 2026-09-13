"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

export function ShareProgressCardButton({ imageUrl, filename, title }: { imageUrl: string; filename: string; title: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; file: File; referral: string | null; native: boolean } | null>(null);
  const busy = useRef(false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);

  async function prepare() {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const [response, parrainageResponse] = await Promise.all([
        fetch(imageUrl),
        fetch("/api/parrainage").catch(() => null),
      ]);
      if (!response.ok) throw new Error("Carte indisponible");
      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type || "image/png" });
      const parrainage = parrainageResponse?.ok ? await parrainageResponse.json() : null;
      if (!blob.type.startsWith("image/")) throw new Error("Format inattendu");
      setPreview({ url: URL.createObjectURL(blob), file, referral: typeof parrainage?.lien === "string" ? parrainage.lien : null,
        native: typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] }) });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError("Impossible de partager pour le moment.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  async function share() {
    if (!preview || busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      // No fetch before this call: preserve the explicit tap on iOS.
      await navigator.share({ title, text: `Mon évolution avec COAI. Fais ton diagnostic : ${preview.referral ?? "https://coai.fr/diagnostic"}`, files: [preview.file] });
      trackFunnelEvent("progress_shared", { support: "native", referral: Boolean(preview.referral) });
      setMessage("Carte transmise au partage de ton appareil.");
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) setError("Le partage n’a pas abouti. Tu peux ouvrir l’image pour l’enregistrer.");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  const actionClass = "inline-flex min-h-11 items-center justify-center rounded-lg border border-laiton-400/30 px-4 py-2 text-sm font-medium text-laiton-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-laiton-300 disabled:opacity-50";

  return (
    <div className="flex w-full flex-col items-start gap-3 sm:w-auto">
      {!preview && <button type="button" onClick={prepare} disabled={loading} className={actionClass}>
        {loading ? "Création…" : "Partager →"}
      </button>}
      {preview && <section aria-label="Aperçu de la carte à partager" className="flex w-full max-w-sm flex-col gap-3">
        <p className="text-sm text-graphite-300">Vérifie les informations visibles avant de partager. Rien n’est publié automatiquement.</p>
        <Image src={preview.url} alt={title} width={1080} height={1080} unoptimized className="max-h-80 w-full rounded-xl object-contain" />
        <div className="flex flex-wrap gap-2">
          {preview.native && <button type="button" onClick={share} disabled={loading} className={actionClass}>{loading ? "Partage…" : "Partager cette carte"}</button>}
          <a href={imageUrl} target="_blank" rel="noopener noreferrer" className={actionClass}>Ouvrir l’image</a>
          <button type="button" disabled={loading} onClick={() => { setPreview(null); setError(null); setMessage(null); }} className={actionClass}>Fermer l’aperçu</button>
        </div>
        <p className="text-xs text-graphite-400">Pour l’enregistrer, ouvre l’image puis utilise le menu du navigateur ou un appui long sur iPhone.</p>
      </section>}
      {error && <span role="alert" className="max-w-sm text-sm text-red-400">{error}</span>}
      {message && <span role="status" className="max-w-sm text-sm text-emerald-400">{message}</span>}
    </div>
  );
}
