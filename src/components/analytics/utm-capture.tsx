"use client";

import { useEffect } from "react";
import { captureUtmFromLocation } from "@/lib/attribution/utm-cookie";

// Capture silencieuse des utm_* à l'arrivée sur une page marketing (Phase
// 5B, 11/08/2026) — rendu dans le layout marketing pour couvrir toutes les
// pages où une pub peut renvoyer (accueil, pages SEO, /diagnostic), pas
// seulement la homepage.
export function UtmCapture() {
  useEffect(() => {
    captureUtmFromLocation();
  }, []);

  return null;
}
