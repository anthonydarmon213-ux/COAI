"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

export function SubscribeButton({
  plan,
  label,
  className,
  billing = "MONTHLY",
}: {
  plan: "STANDARD" | "PREMIUM";
  label: string;
  className?: string;
  billing?: "MONTHLY" | "ANNUAL";
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
        body: JSON.stringify({ plan, billing }),
      });
      if (res.status === 401) {
        // Préserve l'intention (Transformation) à travers l'inscription —
        // sinon /sign-up créait toujours un abonnement Impulsion par défaut.
        window.location.href = `/sign-up?plan=${plan === "STANDARD" ? "STANDARD" : "GRATUIT"}&billing=${billing}`;
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Impossible de démarrer le paiement.");
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
