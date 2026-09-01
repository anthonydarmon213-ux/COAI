"use client";

import { Button } from "@/components/ui/button";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

// Compatibilité avec les anciens écrans : l'ancien achat unique a été retiré.
// Cette action conduit désormais vers les abonnements récurrents officiels.
export function OneShotProgrammeButton({
  label = "Essayer Pass IA pendant 7 jours",
  className,
}: {
  label?: string;
  className?: string;
}) {
  async function handleClick() {
    trackFunnelEvent("checkout_started", { plan: "GRATUIT" });
    window.location.href = "/pricing#pass-ia";
  }

  return (
    <div className={className ?? ""}>
      <Button onClick={handleClick} className="w-full">
        {label}
      </Button>
    </div>
  );
}
