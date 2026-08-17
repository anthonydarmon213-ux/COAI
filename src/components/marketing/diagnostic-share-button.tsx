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

  async function getShareLink() {
    let lien = "https://coai.fr/diagnostic?utm_source=score_coai&utm_medium=share&utm_campaign=compare_score";
    if (connecte) {
      const res = await fetch("/api/parrainage").catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if (typeof data?.lien === "string") lien = data.lien;
    }
    return lien;
  }

  function shareText(lien: string) {
    return `J’ai obtenu ${score}/100 à mon Score COAI pour ${objectif.toLowerCase()}. À ton tour : fais le bilan gratuitement et on compare nos scores 👇\n${lien}`;
  }

  async function partagerWhatsApp() {
    setLoading(true);
    const lien = await getShareLink();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText(lien))}`, "_blank", "noopener,noreferrer");
    trackFunnelEvent("diagnostic_result_shared", { support: "whatsapp", referral: connecte, challenge: "compare_score" });
    setLoading(false);
  }

  async function partagerStory(platform: "instagram" | "tiktok") {
    setLoading(true);
    setMessage(null);
    try {
      const url = `/api/diagnostic/carte-story?score=${score}&objectif=${encodeURIComponent(objectif)}`;
      const [response, lien] = await Promise.all([fetch(url), getShareLink()]);
      if (!response.ok) throw new Error("Carte indisponible");
      const blob = await response.blob();
      const file = new File([blob], `score-coai-${score}.png`, { type: "image/png" });
      // Instagram reçoit plus fiablement l'image quand elle est partagée seule :
      // l'ajout simultané d'un texte/URL peut faire disparaître l'option Story
      // de la feuille de partage iOS. Le lien reste déjà imprimé sur la carte.
      if (platform === "instagram" && navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ files: [file] });
        setMessage("Dans Instagram, choisis « Story » pour publier ta carte.");
        trackFunnelEvent("diagnostic_result_shared", { support: `story_${platform}_native`, referral: connecte, challenge: "compare_score" });
      } else {
        const href = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = href; anchor.download = file.name; anchor.click(); URL.revokeObjectURL(href);
        if (navigator.clipboard) await navigator.clipboard.writeText(lien);
        setMessage(`Carte enregistrée · ouvre ${platform === "instagram" ? "Instagram" : "TikTok"}, crée une Story et sélectionne l’image.`);
        trackFunnelEvent("diagnostic_result_shared", { support: `story_${platform}_download`, referral: connecte, challenge: "compare_score" });
      }
    } catch (caught) {
      if (!(caught instanceof DOMException && caught.name === "AbortError")) setMessage("Impossible de créer la Story pour le moment.");
    } finally { setLoading(false); }
  }

  async function partager() {
    setLoading(true);
    setMessage(null);
    try {
      const lien = await getShareLink();
      const text = shareText(lien);

      if (navigator.share) {
        try {
          await navigator.share({ title: `Mon Score COAI · ${score}/100`, text });
          trackFunnelEvent("diagnostic_result_shared", { support: "native", referral: connecte, challenge: "compare_score" });
          return;
        } catch (caught) {
          if (caught instanceof DOMException && caught.name === "AbortError") return;
        }
      }
      await navigator.clipboard.writeText(text);
      setMessage("Défi copié — envoie-le à tes proches.");
      trackFunnelEvent("diagnostic_result_shared", { support: "clipboard", referral: connecte, challenge: "compare_score" });
    } catch {
      setMessage("Impossible de partager pour le moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="coai-score-challenge flex flex-col items-center gap-2.5 text-center">
      <span className="coai-score-challenge-badge">Défi COAI · {score}/100</span>
      <p className="max-w-sm text-lg font-semibold text-white">Qui de tes proches fera mieux que toi ?</p>
      <p className="max-w-md text-sm leading-6 text-graphite-300">Partage ton Score COAI. Ils font le même bilan gratuitement, puis vous comparez vos points de départ et votre progression.</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={partagerWhatsApp}
          disabled={loading}
          className="rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-[#0b2916] shadow-[0_12px_38px_-14px_rgba(37,211,102,.8)] transition hover:-translate-y-0.5 hover:bg-[#35df75]"
        >
          WhatsApp →
        </button>
        <button type="button" onClick={() => partagerStory("instagram")} disabled={loading} className="coai-instagram-button rounded-full px-6 py-3 text-sm font-bold transition hover:-translate-y-0.5 disabled:opacity-50">Partager sur Instagram</button>
        <button type="button" onClick={() => partagerStory("tiktok")} disabled={loading} className="coai-tiktok-button rounded-full px-6 py-3 text-sm font-bold transition hover:-translate-y-0.5 disabled:opacity-50">Télécharger pour TikTok</button>
        <button
          type="button"
          onClick={partager}
          disabled={loading}
          className="rounded-full border border-laiton-300/30 bg-white/[0.05] px-6 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1] disabled:opacity-50"
        >
          {loading ? "Création…" : "Autres options"}
        </button>
      </div>
      {message && <span className="text-xs text-graphite-500">{message}</span>}
    </div>
  );
}
