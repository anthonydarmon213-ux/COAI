"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

export function SubscribeButton({
  plan,
  label,
}: {
  plan: "STANDARD" | "PREMIUM";
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    trackFunnelEvent("plan_selected", { plan });
    setLoading(true);
    setError(null);
    try {
      trackFunnelEvent("checkout_started", { plan });
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (res.status === 401) {
        // Préserve l'intention (Transformation) à travers l'inscription —
        // sinon /sign-up créait toujours un abonnement Impulsion par défaut.
        window.location.href = plan === "STANDARD" ? "/sign-up?plan=STANDARD" : "/sign-up";
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
    <div className="flex flex-col items-center gap-2">
      <Button onClick={handleClick} disabled={loading}>
        {loading ? "Redirection…" : label}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
