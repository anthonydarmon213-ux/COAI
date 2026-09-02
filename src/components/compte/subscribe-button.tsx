"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";
import {
  clearIntendedPlanCookie,
  storeIntendedPlanCookie,
} from "@/lib/checkout/intended-plan-cookie";

function isInstagramBrowser() {
  if (typeof navigator === "undefined") return false;
  return /Instagram|FBAN|FBAV/i.test(navigator.userAgent);
}

export function SubscribeButton({
  plan,
  label,
  className,
  billing = "MONTHLY",
  vipSessions = 1,
}: {
  plan: "PASS_IA" | "STANDARD" | "PREMIUM";
  label: string;
  className?: string;
  billing?: "MONTHLY" | "QUARTERLY" | "ANNUAL";
  vipSessions?: 1 | 2 | 3 | 4;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [instagramHelp, setInstagramHelp] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  function signUpPath(sourceInstagram = false) {
    const params = new URLSearchParams({
      plan,
      billing,
      vipSessions: String(vipSessions),
    });
    if (sourceInstagram) params.set("source", "instagram");
    return `/sign-up?${params.toString()}`;
  }

  function continueToSignUp() {
    window.location.href = signUpPath(true);
  }

  async function copySafariLink() {
    try {
      const url = new URL(signUpPath(true), window.location.origin).toString();
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
      trackFunnelEvent("instagram_safari_link_copied", { plan, billing });
    } catch {
      setCopyState("error");
    }
  }

  async function handleClick() {
    trackFunnelEvent("plan_selected", { plan, billing });
    setLoading(true);
    setError(null);
    try {
      trackFunnelEvent("checkout_started", { plan, billing });
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billing, vipSessions }),
      });
      if (res.status === 401) {
        // Préserve l'intention (Coaching Hybride) à travers l'inscription —
        // sinon /sign-up créait toujours un abonnement Pass IA par défaut.
        storeIntendedPlanCookie(plan, vipSessions, billing);
        if (isInstagramBrowser()) {
          // Le navigateur Instagram possède ses propres cookies : même une
          // personne déjà connectée dans Safari y apparaît comme déconnectée.
          // Une explication visible remplace la redirection silencieuse qui
          // donnait l'impression que le bouton Stripe ne fonctionnait pas.
          setInstagramHelp(true);
          setLoading(false);
          trackFunnelEvent("instagram_checkout_help_viewed", { plan, billing });
          return;
        }
        window.location.href = signUpPath();
        return;
      }
      const data = await res.json().catch(() => null);
      if (!data) throw new Error("Le paiement n'a pas pu démarrer. Réessaie dans quelques instants.");
      if (!res.ok || !data.url) throw new Error(data.error ?? "Impossible de démarrer le paiement.");
      clearIntendedPlanCookie();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <Button onClick={handleClick} disabled={loading} className={className}>
        {loading ? "Redirection…" : label}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {instagramHelp && (
        <div
          role="status"
          className="mt-2 w-full rounded-2xl border border-laiton-400/35 bg-[#171714] p-4 text-left shadow-[0_18px_55px_-35px_rgba(214,170,96,.8)]"
        >
          <p className="text-sm font-semibold text-white">Avant Stripe, crée ton accès COAI.</p>
          <p className="mt-1 text-xs leading-5 text-graphite-300">
            Instagram ne partage pas ta connexion Safari. Ton offre reste conservée et aucun paiement
            n&apos;est déclenché pendant la création du compte.
          </p>
          <div className="mt-4 grid gap-2">
            <Button type="button" onClick={continueToSignUp} className="w-full">
              Créer mon accès gratuit →
            </Button>
            <button
              type="button"
              onClick={copySafariLink}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-laiton-200 transition hover:border-laiton-400/45 hover:bg-white/[0.04]"
            >
              {copyState === "copied" ? "Lien copié ✓ Ouvre-le dans Safari" : "Copier le lien pour Safari / Apple Pay"}
            </button>
          </div>
          {copyState === "error" && (
            <p className="mt-2 text-xs text-amber-200">Dans Instagram : appuie sur ••• puis « Ouvrir dans le navigateur ».</p>
          )}
          <p className="mt-3 text-[11px] leading-4 text-graphite-500">
            Déjà membre ? Utilise « Se connecter » sur l&apos;écran suivant pour retrouver ton offre.
          </p>
        </div>
      )}
    </div>
  );
}
