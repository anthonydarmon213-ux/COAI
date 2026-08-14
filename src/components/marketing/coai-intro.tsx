"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    <section className="coai-future-hero relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden px-6 pb-10 pt-28 text-center sm:pb-12 sm:pt-32">
      <div className="coai-future-architecture" aria-hidden="true" />
      <div className="coai-future-horizon" aria-hidden="true" />
      <div className="coai-future-ring coai-future-ring-one" aria-hidden="true" />
      <div className="coai-future-ring coai-future-ring-two" aria-hidden="true" />
      {/* Photo en arrière-plan plein cadre (14/08/2026, retour à cette version
          après essai d'un layout scindé photo/texte — jugé "pas aligné" sur
          desktop, cf. historique) — placée après les couches décoratives
          pour rester visible au-dessus d'elles. */}
      <Image
        src="/anthony-studio-premium.jpg"
        alt="Anthony Darmon, fondateur de COAI, dans un studio de coaching premium"
        fill
        sizes="100vw"
        className="object-cover object-top"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0c0d]/35 via-[#0b0c0d]/60 to-[#0b0c0d]/95" aria-hidden="true" />
      {/* La photo contient son propre logo "COAI" imprimé en haut à gauche —
          masqué ici plutôt que retouché dans le fichier, pour ne pas
          doubler avec le logo de la nav juste au-dessus. */}
      <div
        className="pointer-events-none absolute left-0 top-0"
        style={{
          width: "clamp(120px, 32vw, 480px)",
          height: "clamp(80px, 20vw, 300px)",
          background: "radial-gradient(ellipse at 0% 0%, rgba(6,7,8,1) 0%, rgba(6,7,8,1) 62%, rgba(6,7,8,0) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center gap-3">
        <span className="inline-flex items-center font-display text-[clamp(3.2rem,11vw,6.5rem)] font-bold leading-none tracking-tight text-white">
          C
          <svg
            ref={markRef}
            className="coai-intro-mark relative top-[-0.06em] mx-[0.04em] inline-block h-[1.28em] w-[1.28em] align-middle"
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
          AI
        </span>
        <span className="max-w-md text-balance font-mono text-sm font-bold uppercase tracking-[0.16em] text-[#6fc3f0] [text-shadow:0_0_18px_rgba(74,159,201,0.65)]">
          Bienvenue sur la première plateforme de coaching hybride : IA + suivi humain
        </span>
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-5 rounded-[2rem] border border-white/[0.06] bg-black/60 px-5 pb-6 pt-8 shadow-md backdrop-blur-sm sm:px-10">
        <h1 className="mx-auto w-full text-balance font-display text-[clamp(2.4rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
          <span className="text-laiton-300">Sculptez</span> votre corps et décuplez vos{" "}
          <span className="text-laiton-300">performances</span> avec un coaching{" "}
          <span className="text-laiton-300">intelligent</span>, sur-mesure.
        </h1>
        <p className="max-w-lg text-base leading-7 text-graphite-300 sm:text-lg">
          COAI associe la puissance d&apos;une intelligence artificielle de pointe à l&apos;expertise
          de coachs diplômés d&apos;État. Obtenez un programme d&apos;entraînement et de nutrition
          ultra-personnalisé, 100 % adapté à votre rythme et validé par des professionnels.
        </p>
      </div>

      <div className="relative z-10 -mt-4 flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/diagnostic" className="relative">
            <span
              className="animate-halo-blink pointer-events-none absolute -inset-3 -z-10 rounded-full bg-laiton-400 blur-2xl"
              aria-hidden="true"
            />
            <Button className="flex flex-col items-center gap-1 px-9 py-4 text-base uppercase tracking-wide shadow-[0_25px_70px_-18px_rgba(201,162,98,0.95)]">
              <span>Commencer ma transformation — Diagnostic offert</span>
              <span className="text-[11px] font-medium normal-case tracking-normal text-graphite-950/70">
                2 min · gratuit · sans engagement
              </span>
            </Button>
          </Link>
        </div>
        <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:gap-3">
          <span className="flex items-center gap-2 rounded-full border border-laiton-400/40 bg-laiton-400/10 px-4 py-2 text-sm font-semibold text-laiton-200 shadow-[0_0_24px_-8px_rgba(201,162,98,0.6)]">
            <span className="text-laiton-300">✓</span>
            Sans engagement · Résiliable à tout moment
          </span>
          <span className="flex items-center gap-2 rounded-full border border-laiton-400/40 bg-laiton-400/10 px-4 py-2 text-sm font-semibold text-laiton-200 shadow-[0_0_24px_-8px_rgba(201,162,98,0.6)]">
            <span className="text-laiton-300">✓</span>
            17+ ans d&apos;expertise terrain intégrés dans nos algorithmes
          </span>
        </div>
      </div>
    </section>
  );
}
