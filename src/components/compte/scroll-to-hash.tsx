"use client";

import { useEffect } from "react";

// Next.js ne scrolle pas toujours vers l'ancre (#vip) lors d'une navigation
// client depuis un lien de la nav : la page est un Server Component, la
// cible n'existe pas encore dans le DOM au moment où Next tente le scroll.
// Repéré le 15/08/2026 — clic sur "VIP" dans la nav restait en haut de page
// (sur "Mon histoire") au lieu de rejoindre la carte VIP plus bas.
export function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.slice(1);
    let tentatives = 0;
    const essayer = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ block: "start" });
        return;
      }
      tentatives += 1;
      if (tentatives < 10) requestAnimationFrame(essayer);
    };
    requestAnimationFrame(essayer);
  }, []);

  return null;
}
