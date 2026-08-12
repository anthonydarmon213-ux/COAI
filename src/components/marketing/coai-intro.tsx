"use client";

import { useEffect, useRef } from "react";
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
    <section className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden px-6 pb-10 pt-28 text-center sm:pb-12 sm:pt-32">
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

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center gap-5">
        <Link href="/pricing" className="rounded-full border border-laiton-400/35 bg-laiton-400/[0.1] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-laiton-200 transition hover:bg-laiton-400/[0.16]">
          7 jours offerts · sans engagement
        </Link>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-laiton-400">
          L&apos;humain valide. L&apos;IA personnalise.
        </p>
        <h1 className="mx-auto w-full text-balance font-display text-[clamp(2.4rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-white">
          Ton programme <span className="text-laiton-300">évolue</span> avec toi.
        </h1>
        <p className="max-w-lg text-base leading-7 text-graphite-300 sm:text-lg">
          Ton corps change. Ton emploi du temps change. Tes performances changent. COAI adapte
          ton entraînement, ta nutrition et ta récupération au fil du temps.
        </p>
      </div>

      <div className="relative z-10 mt-2 flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/pricing">
            <Button className="px-7 py-3 uppercase tracking-wide">Essayer COAI 7 jours</Button>
          </Link>
          <Link href="/diagnostic">
            <Button variant="secondary" className="px-7 py-3 uppercase tracking-wide">
              Diagnostic offert
            </Button>
          </Link>
        </div>
        <p className="max-w-md text-xs leading-5 text-graphite-400">
          7 jours offerts sur Impulsion et Transformation. Carte bancaire demandée, puis 19 € ou 49 €/mois selon la formule. Annulation possible avant la fin de l&apos;essai.
        </p>
        {/* Accès direct discret aux tarifs (11/08/2026, correction Anthony) :
            un prospect chaud doit pouvoir acheter sans passer par le
            diagnostic — volontairement en retrait pour ne pas concurrencer
            le CTA principal. */}
        <a href="#comment-ca-marche" className="text-xs text-graphite-600 underline transition hover:text-graphite-400">
          Découvrir comment ça marche
        </a>
      </div>
    </section>
  );
}
