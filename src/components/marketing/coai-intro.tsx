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
    <section className="coai-future-hero relative overflow-hidden px-6 pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="coai-future-architecture" aria-hidden="true" />
      <div className="coai-future-horizon" aria-hidden="true" />
      <div className="coai-future-ring coai-future-ring-one" aria-hidden="true" />
      <div className="coai-future-ring coai-future-ring-two" aria-hidden="true" />

      {/* Layout scindé (14/08/2026) : photo à gauche (visage visible, plus de
          texte superposé par-dessus), titres à droite. Remplace l'ancien
          plein cadre avec texte centré par-dessus, qui masquait le visage
          derrière la carte de titre. */}
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-16">
        <div className="relative aspect-[941/1672] w-full max-w-[19rem] shrink-0 overflow-hidden rounded-[2rem] border border-white/[0.08] shadow-2xl sm:max-w-xs lg:w-[34%] lg:max-w-none">
          <Image
            src="/anthony-studio-premium.jpg"
            alt="Anthony Darmon, fondateur de COAI, dans un studio de coaching premium"
            fill
            sizes="(min-width: 1024px) 34vw, 76vw"
            className="object-cover object-top"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0d]/55 via-transparent to-transparent" aria-hidden="true" />
          {/* La photo contient son propre logo "COAI" imprimé en haut à gauche
              (14/08/2026) — masqué ici plutôt que retouché dans le fichier,
              pour ne pas doubler avec le logo de la nav juste au-dessus. */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-48 w-56"
            style={{
              background:
                "radial-gradient(circle 175px at 0% 0%, rgba(6,7,8,1) 0%, rgba(6,7,8,1) 68%, rgba(6,7,8,0) 100%)",
            }}
            aria-hidden="true"
          />
        </div>

        <div className="flex flex-col items-center gap-8 text-center lg:flex-1 lg:items-start lg:text-left">
          <svg
            ref={markRef}
            className="coai-intro-mark"
            width="80"
            height="80"
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

          <div className="flex flex-col items-center gap-3 lg:items-start">
            <span className="font-display text-[clamp(2.8rem,9vw,5.5rem)] font-bold leading-none tracking-tight text-white">
              COAI
            </span>
            <span className="max-w-md text-balance font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#4a9fc9]">
              Bienvenue sur la première plateforme de coaching sportif hybride : IA + validation et suivi humain
            </span>
          </div>

          <div className="flex w-full max-w-xl flex-col items-center gap-5 rounded-[2rem] border border-white/[0.08] bg-black/20 px-5 py-8 shadow-2xl backdrop-blur-[2px] sm:px-10 lg:items-start">
            <h1 className="w-full text-balance font-display text-[clamp(2.2rem,5vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
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

          <div className="mt-2 flex flex-col items-center gap-4 lg:items-start">
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/diagnostic">
                <Button className="px-7 py-3 uppercase tracking-wide">
                  Commencer ma transformation — Diagnostic offert
                </Button>
              </Link>
            </div>
            <p className="max-w-md text-xs leading-5 text-graphite-400">
              2 min, gratuit, sans engagement.
            </p>
            <div className="flex flex-col items-center gap-1.5 text-xs text-graphite-400 sm:flex-row sm:gap-5 lg:items-start">
              <span className="flex items-center gap-1.5">
                <span className="text-laiton-400">✓</span>
                Sans engagement · Résiliable à tout moment
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-laiton-400">✓</span>
                17+ ans d&apos;expertise terrain intégrés dans nos algorithmes
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
