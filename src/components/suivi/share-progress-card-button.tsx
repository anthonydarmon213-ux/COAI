"use client";

import { useState } from "react";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

export function ShareProgressCardButton({ imageUrl, filename, title }: { imageUrl: string; filename: string; title: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function share() {
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
      const referralLink = typeof parrainage?.lien === "string" ? parrainage.lien : "https://coai.fr/diagnostic";
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ title, text: `Mon évolution avec COAI. Fais ton diagnostic : ${referralLink}`, files: [file] });
        trackFunnelEvent("progress_shared", { support: "native", referral: Boolean(parrainage?.lien) });
      } else {
        // Repli sans Web Share API : ouvre la carte dans un nouvel onglet
        // au lieu de cliquer un <a download> sur un blob: (22/08/2026).
        // Même bug que celui corrigé sur DiagnosticShareButton le 21/08 :
        // sur Safari iOS, ce clic synthétique peut naviguer l'onglet en
        // cours au lieu de télécharger, éjectant la personne de la page
        // sans retour possible. Concerne les 3 pages qui utilisent ce
        // bouton (évolution, tests-maxi, progression).
        const href = URL.createObjectURL(blob);
        window.open(href, "_blank", "noopener,noreferrer");
        if (parrainage?.lien && navigator.clipboard) {
          await navigator.clipboard.writeText(referralLink);
          setMessage("Carte ouverte dans un nouvel onglet · lien de parrainage copié");
        } else {
          setMessage("Carte ouverte dans un nouvel onglet — enregistre-la pour la publier");
        }
        trackFunnelEvent("progress_shared", { support: "download", referral: Boolean(parrainage?.lien) });
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
      {message && <span className="max-w-56 text-right text-[11px] text-emerald-400">{message}</span>}
    </div>
  );
}
