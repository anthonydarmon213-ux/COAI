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
    <section className="coai-future-hero coai-landing-hero relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden px-6 pb-12 pt-28 text-center sm:pb-16 sm:pt-32">
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
        className="coai-landing-hero-image object-cover object-top"
        priority
      />
      <div className="coai-landing-hero-overlay absolute inset-0" aria-hidden="true" />
      {/* La photo contient son propre logo "COAI" imprimé en haut à gauche —
          masqué ici plutôt que retouché dans le fichier, pour ne pas
          doubler avec le logo de la nav juste au-dessus. */}
      <div
        className="pointer-events-none absolute left-0 top-0"
        style={{
          width: "clamp(120px, 32vw, 480px)",
          height: "clamp(80px, 20vw, 300px)",
          background: "radial-gradient(ellipse at 0% 0%, rgba(246,242,233,.96) 0%, rgba(246,242,233,.92) 58%, rgba(246,242,233,0) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center gap-3">
        <span className="coai-landing-wordmark inline-flex items-center font-display text-[clamp(3.2rem,11vw,6.5rem)] font-bold leading-none tracking-tight text-white">
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
        <span className="coai-landing-eyebrow max-w-xl text-balance text-sm font-semibold tracking-[0.04em] sm:text-base">
          Le coaching intelligent. L&apos;expertise humaine.
        </span>
      </div>

      <div className="coai-landing-promise relative z-10 flex w-full max-w-3xl flex-col items-center gap-5 rounded-[2rem] border px-5 pb-7 pt-8 backdrop-blur-md sm:px-12 sm:py-10">
        <h1 className="mx-auto w-full text-balance font-display text-[clamp(2.4rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
          Le corps que tu imagines. Le niveau que tu pensais inaccessible.
        </h1>
        <p className="max-w-lg text-base leading-7 text-graphite-300 sm:text-lg">
          COAI transforme plus de 17 ans d&apos;expertise terrain en un accompagnement qui
          comprend ton corps, s&apos;adapte à ta vraie vie et évolue avec toi. L&apos;IA personnalise.
          Un coach diplômé suit, valide et reste disponible quand tu en as besoin.
        </p>
      </div>

      <div className="relative z-10 -mt-4 flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/diagnostic" className="relative">
            <span
              className="animate-halo-blink pointer-events-none absolute -inset-3 -z-10 rounded-full bg-laiton-400 blur-2xl"
              aria-hidden="true"
            />
            <Button className="px-9 py-4 text-base font-bold uppercase tracking-[0.04em] shadow-[0_25px_70px_-18px_rgba(201,162,98,0.95)]">
              <span>Découvrir mon potentiel — Diagnostic offert</span>
            </Button>
          </Link>
          <span className="w-full text-center text-sm font-medium text-[#5f605b]">
            2 min · gratuit · sans engagement
          </span>
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
