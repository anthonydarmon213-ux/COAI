"use client";

import { useEffect, useRef, useState } from "react";

// Révélation au scroll (16/08/2026, demande Anthony "il faut faire rêver
// les gens" / référence Future) — réutilise le keyframe coai-reveal-up déjà
// en place (bienvenue/dashboard), mais déclenché par IntersectionObserver
// plutôt qu'un simple délai au chargement : sur une page longue comme la
// homepage, un délai fixe au montage ne rejoue rien quand on scrolle plus
// bas. Se désactive proprement si prefers-reduced-motion (animate-reveal
// n'existe alors pas côté CSS, l'élément reste simplement visible).
export function Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${visible ? "animate-reveal" : "opacity-0"}`}
      style={visible ? { animationDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
