"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

export function VipCheckoutButton({
  pack,
  label,
  variant,
}: {
  pack: "VISIO" | "PRESENTIEL";
  label: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    trackFunnelEvent("checkout_started", { plan: "VIP", pack });
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/vip-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error ?? "Impossible de démarrer le paiement.");
      window.location.href = data.url;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <Button onClick={handleClick} disabled={loading} variant={variant} size="compact" className="w-full">
        {loading ? "Redirection…" : label}
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
