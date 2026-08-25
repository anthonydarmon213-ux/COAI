"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";
import { clearIntendedPlanCookie } from "@/lib/checkout/intended-plan-cookie";

export function SubscribeButton({
  plan,
  label,
  className,
  billing = "MONTHLY",
  vipSessions = 1,
}: {
  plan: "GRATUIT" | "STANDARD" | "PREMIUM";
  label: string;
  className?: string;
  billing?: "MONTHLY" | "ANNUAL";
  vipSessions?: 1 | 2 | 3 | 4;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        window.location.href = `/sign-up?plan=${plan}&billing=${billing}&vipSessions=${vipSessions}`;
        return;
      }
      const data = await res.json();
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
    </div>
  );
}
