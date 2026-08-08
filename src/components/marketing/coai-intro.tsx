"use client";

import { useEffect, useRef } from "react";

// Écran d'ouverture de la landing page : rejoue la séquence du brand book
// (arc humain qui se referme, anneau IA qui apparaît, point central) avant
// le hero produit. Joue une fois au chargement, respecte prefers-reduced-motion.
export function CoaiIntro() {
  const markRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const timeout = setTimeout(() => markRef.current?.classList.add("in"), 150);
      return () => clearTimeout(timeout);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 18% 15%, rgba(201,162,98,0.14), transparent 55%), radial-gradient(circle at 82% 25%, rgba(91,130,150,0.12), transparent 55%)",
        }}
        aria-hidden="true"
      />

      <svg
        ref={markRef}
        className="coai-intro-mark relative z-10"
        width="96"
        height="96"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          className="coai-intro-arc-human"
          cx="60"
          cy="60"
          r="44"
          stroke="#c9a262"
          strokeWidth="7"
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <circle
          className="coai-intro-arc-ai"
          cx="60"
          cy="60"
          r="28"
          stroke="#6b7078"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="3.2 3.6"
        />
        <circle className="coai-intro-dot" cx="60" cy="60" r="5.5" fill="#3d7a99" />
        <circle className="coai-intro-dot" cx="60" cy="60" r="2.5" fill="#0d1b22" />
        <circle className="coai-intro-dot" cx="58.5" cy="58.5" r="0.9" fill="#eaf4f8" />
      </svg>

      <div className="relative z-10 flex flex-col items-center gap-2">
        <span className="font-display text-[clamp(3.2rem,11vw,6.5rem)] font-bold leading-none tracking-tight text-white">
          COAI
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.32em] text-laiton-400">HI × AI™</span>
      </div>

      <p className="relative z-10 max-w-md font-editorial text-xl italic text-graphite-300 sm:text-2xl">
        « L&apos;IA génère. Ton coach valide. »
      </p>

      <p className="relative z-10 max-w-md text-sm leading-6 text-graphite-400 sm:text-base">
        COAI génère ton programme d&apos;entraînement, nutrition et récupération par IA — toujours
        validé par un vrai coach avant de te l&apos;envoyer.
      </p>

      <a
        href="#hero"
        className="group relative z-10 mt-6 flex items-center gap-2 rounded-full border border-acier/40 bg-acier/[0.08] px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-graphite-200 shadow-[0_8px_24px_-12px_rgba(91,130,150,0.6)] transition hover:border-acier/70 hover:bg-acier/[0.14] hover:text-white"
      >
        Découvrir
        <span aria-hidden="true" className="text-acier transition group-hover:translate-y-0.5">↓</span>
      </a>
    </section>
  );
}
