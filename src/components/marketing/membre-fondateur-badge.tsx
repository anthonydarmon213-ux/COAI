"use client";

import { useEffect, useState } from "react";
import { MEMBRES_FONDATEURS_MAX } from "@/lib/pricing/membre-fondateur-constants";

// Badge "membre fondateur" (19/08/2026) — compte réel récupéré via
// /api/membres-fondateurs (jamais un chiffre inventé côté client). N'affiche
// rien tant que le compte n'est pas connu, ni si les places sont prises.
//
// Le compteur de places a disparu (02/09/2026, demande Anthony) :
// "49/50 places restantes" annonçait surtout qu'un seul membre avait
// souscrit — de la preuve sociale à l'envers. Le compte reste interrogé
// car il conditionne l'affichage, mais le badge ne porte plus de rareté :
// l'urgence est tenue par le compte à rebours de l'offre de rentrée, une
// date ne révélant jamais le nombre de clients. Reste ici le seul
// argument qui gagne à être répété, l'avantage acquis à vie.
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
        🔒 Ton tarif bloqué à vie
      </p>
      <p className="mt-1 text-xs leading-5 text-graphite-300">
        Le tarif auquel tu souscris aujourd&apos;hui reste le tien, même quand
        le prix augmentera pour les nouveaux membres.
      </p>
    </div>
  );
}
