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
      {/* Photo au-dessus des couches décoratives (13/08/2026) — placée avant,
          l'ancienne "architecture" (opacity .9) la recouvrait presque
          entièrement, la rendant quasi invisible malgré la balise Image
          bien présente. */}
      <Image
        src="/anthony-studio-premium.jpg"
        alt="Anthony Darmon, fondateur de COAI, dans un studio de coaching premium"
        fill
        sizes="100vw"
        className="object-cover object-top"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b0c0d]/35 via-[#0b0c0d]/60 to-[#0b0c0d]/95" aria-hidden="true" />

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

      <div className="relative z-10 flex flex-col items-center gap-3">
        <span className="font-display text-[clamp(3.2rem,11vw,6.5rem)] font-bold leading-none tracking-tight text-white">
          COAI
        </span>
        <span className="max-w-md text-balance font-mono text-xs uppercase tracking-[0.18em] text-laiton-400">
          La première plateforme de coaching sportif hybride : IA + validation et suivi humain
        </span>
      </div>

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-5 rounded-[2rem] border border-white/[0.08] bg-black/20 px-5 py-8 shadow-2xl backdrop-blur-[2px] sm:px-10">
        <h1 className="mx-auto w-full text-balance font-display text-[clamp(2.4rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
          Sculptez votre corps et décuplez vos <span className="text-laiton-300">performances</span> avec
          un coaching intelligent, sur-mesure.
        </h1>
        <p className="max-w-lg text-base leading-7 text-graphite-300 sm:text-lg">
          COAI associe la puissance d&apos;une intelligence artificielle de pointe à l&apos;expertise
          de coachs diplômés d&apos;État. Obtenez un programme d&apos;entraînement et de nutrition
          ultra-personnalisé, 100 % adapté à votre rythme et validé par des professionnels.
        </p>
      </div>

      <div className="relative z-10 mt-2 flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/diagnostic">
            <Button className="px-7 py-3 uppercase tracking-wide">Diagnostic offert</Button>
          </Link>
          <Link href="/sign-up">
            <Button variant="secondary" className="px-7 py-3 uppercase tracking-wide">
              Commencer ma transformation
            </Button>
          </Link>
        </div>
        <p className="max-w-md text-xs leading-5 text-graphite-400">
          2 min, gratuit, sans engagement.
        </p>
      </div>
    </section>
  );
}
