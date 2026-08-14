"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

// Déblocage Impulsion (13/08/2026, nouveau modèle d'accès libre) : paiement
// unique de 19€ pour générer son programme, déclenchable depuis n'importe
// quelle page où l'utilisateur voit son interface verrouillée (dashboard,
// page de pilier) ou depuis /pricing avant inscription. Si l'appel échoue
// faute d'authentification (visiteur pas encore inscrit), redirige vers
// l'inscription libre plutôt que d'afficher une erreur — le paiement se
// termine dès qu'il revient, sans reperdre son intention.
export function OneShotProgrammeButton({
  label = "Générer mon programme — 19€",
  className,
}: {
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    trackFunnelEvent("checkout_started", { plan: "GRATUIT" });
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/checkout-programme", { method: "POST" });
      if (response.status === 401) {
        window.location.href = "/sign-up";
        return;
      }
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error ?? "Impossible de démarrer le paiement.");
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
