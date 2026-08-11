"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

// Wrapper client minimal (Phase 5B, 11/08/2026) : /pricing est un Server
// Component, qui ne peut pas porter d'onClick directement — ce composant
// isole juste l'événement funnel "plan_selected" sans rendre toute la page
// cliente.
export function PlanSelectedLink({
  href,
  plan,
  label,
}: {
  href: string;
  plan: "GRATUIT" | "STANDARD" | "VIP";
  label: string;
}) {
  return (
    <Link href={href} onClick={() => trackFunnelEvent("plan_selected", { plan })}>
      <Button>{label}</Button>
    </Link>
  );
}
