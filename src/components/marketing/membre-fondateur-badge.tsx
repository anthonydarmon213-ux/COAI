"use client";

import { useEffect, useState } from "react";
import { MEMBRES_FONDATEURS_MAX } from "@/lib/pricing/membre-fondateur-constants";

// Badge "membre fondateur" (19/08/2026) — compte réel récupéré via
// /api/membres-fondateurs (jamais un chiffre inventé côté client). N'affiche
// rien tant que le compte n'est pas connu, et rien du tout si les 100
// places sont déjà prises (jamais un faux compteur à zéro qui resterait
// affiché indéfiniment).
export function MembreFondateurBadge() {
  const [placesRestantes, setPlacesRestantes] = useState<number | null>(null);

  useEffect(() => {
    let annule = false;
    fetch("/api/membres-fondateurs")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!annule && data && typeof data.placesRestantes === "number") {
          setPlacesRestantes(data.placesRestantes);
        }
      })
      .catch(() => {});
    return () => {
      annule = true;
    };
  }, []);

  if (placesRestantes === null || placesRestantes <= 0) return null;

  return (
    <div className="rounded-xl border border-laiton-400/30 bg-laiton-400/[0.08] px-3 py-2 text-left">
      <p className="text-xs font-bold uppercase tracking-wide text-laiton-300">
        🚀 Offre membre fondateur — {placesRestantes}/{MEMBRES_FONDATEURS_MAX} places restantes
      </p>
      <p className="mt-1 text-xs leading-5 text-graphite-300">
        Ton tarif Pass IA reste bloqué à vie, même si le prix augmente plus tard pour les nouveaux membres.
      </p>
    </div>
  );
}
