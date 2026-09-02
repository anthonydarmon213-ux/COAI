"use client";

import { useEffect, useState } from "react";
import { MEMBRES_FONDATEURS_MAX } from "@/lib/pricing/membre-fondateur-constants";

// Bandeau défilant "offre fondateur" (21/08/2026, demande Anthony — "un
// petit qui défile pour mettre un peu de pression"). Le compte reste celui,
// réel, déjà servi par /api/membres-fondateurs et affiché statiquement dans
// MembreFondateurBadge — ce composant ne fait qu'habiller la même donnée en
// bandeau animé, jamais un chiffre différent ou un compte à rebours à date
// inventée : cf. membre-fondateur.ts, "jamais un chiffre inventé pour créer
// une fausse urgence". Le message se répète en boucle plutôt que de
// simuler une activité (pas de fausse notification "Julie vient de
// s'abonner") — on n'a pas ce flux de données, donc on ne l'invente pas.
export function FondateurTicker() {
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

  // Le nombre restant est volontairement tu : l'afficher revenait à
  // annoncer le nombre de places vides.
  const message = `🔒 Prix Pass IA bloqué à vie · Le tarif auquel tu souscris reste le tien, même quand il augmentera pour les nouveaux membres`;

  return (
    <div
      className="coai-fondateur-ticker relative w-full overflow-hidden border-y border-laiton-400/25 bg-laiton-400/[0.06] py-2"
      role="status"
      aria-label={message}
    >
      <div className="coai-fondateur-ticker-track flex w-max items-center gap-16 whitespace-nowrap font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-laiton-300">
        {/* Le message est dupliqué 4x pour boucler sans coupure visible, la
            piste faisant deux fois la largeur visible avant de se répéter. */}
        {[0, 1, 2, 3].map((i) => (
          <span key={i} aria-hidden={i > 0} className="flex items-center gap-16">
            <span>{message}</span>
          </span>
        ))}
      </div>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .coai-fondateur-ticker-track {
            animation: coai-fondateur-scroll 28s linear infinite;
          }
        }
        @keyframes coai-fondateur-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
