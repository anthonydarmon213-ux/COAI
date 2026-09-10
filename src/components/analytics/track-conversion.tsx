"use client";

import { useEffect, useRef } from "react";
import { CONSENT_EVENT } from "@/lib/analytics/consent";
import { ANALYTICS_READY_EVENT, createConversionTracker } from "@/lib/analytics/conversion-delivery";

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
  const tracker = useRef<{ identity: string; attempt: () => void } | null>(null);
  const identity = JSON.stringify([name, onceKey, metaEvent]);
  if (tracker.current?.identity !== identity) {
    tracker.current = { identity, attempt: createConversionTracker({ name, params, metaEvent, metaParams, onceKey }) };
  }
  const attempt = tracker.current.attempt;
  useEffect(() => {
    window.addEventListener(CONSENT_EVENT, attempt);
    window.addEventListener(ANALYTICS_READY_EVENT, attempt);
    attempt();
    return () => {
      window.removeEventListener(CONSENT_EVENT, attempt);
      window.removeEventListener(ANALYTICS_READY_EVENT, attempt);
    };
  }, [attempt]);

  return null;
}
