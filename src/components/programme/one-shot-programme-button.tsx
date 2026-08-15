"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

export type ImpulsionOffer = "PROGRAMME" | "COACH" | "BUNDLE";

export function ImpulsionCheckoutButton({
  offer,
  label,
  className,
}: {
  offer: ImpulsionOffer;
  label: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    trackFunnelEvent("checkout_started", { plan: "GRATUIT", offer });
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout-programme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offer }),
      });
      if (response.status === 401) {
        window.location.href = `/sign-up?offer=${offer}`;
        return;
      }
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Impossible de démarrer le paiement.");
      }
      window.location.href = data.url;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <Button onClick={handleClick} disabled={loading} className="w-full">
        {loading ? "Redirection…" : label}
      </Button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function OneShotProgrammeButton({
  label = "Générer mon programme — 9€",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <ImpulsionCheckoutButton
      offer="PROGRAMME"
      label={label}
      className={className}
    />
  );
}
