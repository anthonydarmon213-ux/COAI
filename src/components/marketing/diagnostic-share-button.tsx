"use client";

import { useState } from "react";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

// Bouton de partage sur l'écran résultat du diagnostic (14/08/2026, demande
// Anthony — "on peut tester") : jusqu'ici aucun partage n'était proposé au
// moment le plus chaud émotionnellement (juste après avoir vu son "Aujourd'hui
// → Avec COAI" personnalisé), alors que le système de parrainage existe déjà
// ailleurs (compte/abonnement, cartes de progression). Texte volontairement
// simple (pas d'image générée ici, contrairement aux cartes de progression —
// portée limitée pour un premier test). Un visiteur connecté partage son vrai
// lien de parrainage (chargé à la demande, pas au montage, pour ne jamais
// appeler /api/parrainage pour un visiteur anonyme qui n'en a pas) ; un
// visiteur anonyme partage simplement le diagnostic public.
export function DiagnosticShareButton({ connecte, objectif, score }: { connecte: boolean; objectif: string; score: number }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const whatsappText = encodeURIComponent(
    `Mon Indice COAI est de ${score}/100. COAI vient de révéler mes leviers pour ${objectif.toLowerCase()}. Fais ton diagnostic gratuitement : https://coai.fr/diagnostic`
  );

  async function partager() {
    setLoading(true);
    setMessage(null);
    try {
      let lien = "https://coai.fr/diagnostic";
      if (connecte) {
        const res = await fetch("/api/parrainage").catch(() => null);
        const data = res?.ok ? await res.json() : null;
        if (typeof data?.lien === "string") lien = data.lien;
      }
      const text = `Mon Indice COAI est de ${score}/100. COAI vient de révéler mes leviers pour ${objectif.toLowerCase()}. Découvre gratuitement le tien :`;

      if (navigator.share) {
        try {
          await navigator.share({ title: "Mon diagnostic COAI", text, url: lien });
          trackFunnelEvent("diagnostic_result_shared", { support: "native", referral: connecte });
          return;
        } catch (caught) {
          if (caught instanceof DOMException && caught.name === "AbortError") return;
        }
      }
      await navigator.clipboard.writeText(lien);
      setMessage("Lien copié.");
      trackFunnelEvent("diagnostic_result_shared", { support: "clipboard", referral: connecte });
    } catch {
      setMessage("Impossible de partager pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <p className="max-w-sm text-base font-semibold text-white">
        Tu es sur la bonne voie. Continue ta transformation — partage-la.
      </p>
      <p className="max-w-sm text-sm text-graphite-300">Compare ta forme avec tes proches.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-[#0b2916] shadow-[0_12px_38px_-14px_rgba(37,211,102,.8)] transition hover:-translate-y-0.5 hover:bg-[#35df75]"
        >
          Partager sur WhatsApp →
        </a>
        <button
          type="button"
          onClick={partager}
          disabled={loading}
          className="rounded-full border border-laiton-300/30 bg-white/[0.05] px-6 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1] disabled:opacity-50"
        >
          {loading ? "…" : "Autres options"}
        </button>
      </div>
      {message && <span className="text-xs text-graphite-500">{message}</span>}
    </div>
  );
}
