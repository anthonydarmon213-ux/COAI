"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(refresh: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", refresh);
  return () => query.removeEventListener("change", refresh);
}
const reducedMotionSnapshot = () => window.matchMedia(motionQuery).matches;
// Le rendu serveur et son hydratation affichent le résultat sans animation.
const serverReducedMotion = () => true;

export function useAnimatedNumber(target: number, duration = 1100) {
  const reducedMotion = useSyncExternalStore(subscribeMotion, reducedMotionSnapshot, serverReducedMotion);
  const [frameValue, setFrameValue] = useState({ target, value: 0 });
  const immediate = reducedMotion || duration <= 0;

  useEffect(() => {
    if (immediate) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.max(0, Math.min(1, (now - start) / duration));
      setFrameValue({ target, value: Math.round(target * (1 - Math.pow(1 - progress, 3))) });
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, immediate]);

  return immediate ? target : frameValue.target === target ? frameValue.value : 0;
}
