"use client";

import { useEffect } from "react";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";
import { hasConsent } from "@/lib/analytics/consent";

// Déclenche un événement de conversion GA4 (et, depuis le 11/08/2026, son
// équivalent Meta Pixel) une fois, côté client — utilisé sur les pages de
// confirmation (abonnement, inscription) pour mesurer ce qu'apporte chaque
// source de trafic (UTM / pub payante) jusqu'à la conversion réelle.
// `name`/`params` restent le vocabulaire GA4 (libre) ; `metaEvent` doit être
// un événement standard Meta (Lead, CompleteRegistration, StartTrial,
// Subscribe, Purchase...) quand on veut aussi nourrir l'optimisation des
// pubs Meta — omis si cette conversion n'a pas d'équivalent pertinent.
export function TrackConversion({
  name,
  params,
  metaEvent,
  metaParams,
  onceKey,
}: {
  name: string;
  params?: Record<string, unknown>;
  metaEvent?: string;
  metaParams?: Record<string, unknown>;
  onceKey?: string;
}) {
  useEffect(() => {
    if (!hasConsent("audience") && !hasConsent("marketing")) return;
    try {
    const storageKey = onceKey ? `coai_conversion_${name}_${onceKey}` : null;
    if (storageKey && window.localStorage.getItem(storageKey)) return;
    const audienceSent = trackEvent(name, params);
    const marketingSent = metaEvent ? trackMetaEvent(metaEvent, metaParams) : false;
    if (storageKey && (audienceSent || marketingSent)) window.localStorage.setItem(storageKey, "1");
    } catch { /* Optional tracking must never interrupt the customer journey. */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
