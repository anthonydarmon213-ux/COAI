"use client";

import { useEffect } from "react";

// Enregistre /sw.js côté client (22/08/2026). Uniquement en production :
// en développement, un service worker actif sert des assets figés et fait
// croire à des bugs de rechargement qui n'existent pas.
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    // Après le load : l'enregistrement ne doit jamais concurrencer le
    // premier rendu pour la bande passante.
    const enregistrer = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Échec silencieux : l'app fonctionne parfaitement sans PWA.
      });
    };
    if (document.readyState === "complete") enregistrer();
    else window.addEventListener("load", enregistrer, { once: true });
  }, []);

  return null;
}
