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
    let lien = "https://coai.fr/diagnostic";
    if (connecte) {
      const res = await fetch("/api/parrainage").catch(() => null);
      const data = res?.ok ? await res.json() : null;
      if (typeof data?.lien === "string") lien = data.lien;
    }
    const url = new URL(lien, window.location.origin);
    if (connecte) {
      // /invitation/[code] conserve le score pendant sa redirection vers le
      // diagnostic : le filleul arrive directement avec un objectif clair à
      // battre, sans exposer le nom ni les réponses du parrain.
      url.searchParams.set("score", String(score));
    } else {
      url.searchParams.set("challenge_score", String(score));
    }
    url.searchParams.set("utm_source", "score_coai");
    url.searchParams.set("utm_medium", "share");
    url.searchParams.set("utm_campaign", "score_challenge");
    url.searchParams.set("utm_content", `score_${score}`);
    return url.toString();
  }

  function shareText(lien: string) {
    return `J’ai obtenu ${score}/100 à mon Score COAI pour ${objectif.toLowerCase()}. Essaie de battre mon score : le bilan est gratuit 👇\n${lien}`;
  }

  async function partagerWhatsApp() {
    setLoading(true);
    const lien = await getShareLink();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText(lien))}`, "_blank", "noopener,noreferrer");
    trackFunnelEvent("diagnostic_result_shared", { support: "whatsapp", referral: connecte, challenge: "compare_score" });
    setLoading(false);
  }

  async function partagerEmail() {
    setLoading(true);
    const lien = await getShareLink();
    window.location.href = `mailto:?subject=${encodeURIComponent(`Mon Score COAI · ${score}/100`)}&body=${encodeURIComponent(shareText(lien))}`;
    trackFunnelEvent("diagnostic_result_shared", { support: "email", referral: connecte, challenge: "compare_score" });
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
        setMessage("Carte prête ✓ Dans Instagram : appuie sur +, choisis Story, puis sélectionne la carte.");
        trackFunnelEvent("diagnostic_result_shared", { support: `story_${platform}_native`, referral: connecte, challenge: "compare_score" });
      } else {
        const href = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = href; anchor.download = file.name; anchor.click(); URL.revokeObjectURL(href);
        if (navigator.clipboard) await navigator.clipboard.writeText(lien);
        setMessage(platform === "instagram"
          ? "Carte enregistrée ✓ Ouvre Instagram → + → Story → sélectionne la carte. Le lien du défi est copié."
          : "Carte enregistrée ✓ Ouvre TikTok, crée une Story et sélectionne la carte.");
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
    <div className="flex flex-col items-center gap-2 text-center">
      <p className="text-sm text-graphite-400">Envie de partager ton score&nbsp;?</p>
      {connecte && (
        <p className="text-xs text-graphite-500">
          Si un proche rejoint COAI avec ton lien, un mois t’est offert.
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={partagerWhatsApp}
          disabled={loading}
          className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.1]"
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={partagerEmail}
          disabled={loading}
          className="rounded-full border border-white/15 bg-transparent px-4 py-2 text-xs font-semibold text-graphite-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
        >
          E-mail
        </button>
      </div>
      {message && <span className="text-xs text-graphite-500">{message}</span>}
    </div>
  );
}
