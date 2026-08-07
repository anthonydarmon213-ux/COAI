"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

// Déclenche un événement de conversion GA4 une fois, côté client — utilisé
// sur les pages de confirmation (abonnement, inscription) pour mesurer ce
// qu'apporte chaque source de trafic (UTM) jusqu'à la conversion réelle.
export function TrackConversion({ name, params }: { name: string; params?: Record<string, unknown> }) {
  useEffect(() => {
    trackEvent(name, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
