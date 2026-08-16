"use client";

import Link from "next/link";
import { CoaiMark } from "@/components/brand/coai-mark";
import { Button } from "@/components/ui/button";

// Écran d'ouverture de la landing page : rejoue la séquence du brand book
// (arc humain qui se referme, anneau IA qui apparaît, point central) avant
// le hero produit. Joue une fois au chargement, respecte prefers-reduced-motion.
export function CoaiIntro() {
  return (
    <section className="coai-future-hero coai-landing-hero relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden px-6 pb-12 pt-28 text-center sm:pb-16 sm:pt-32">
      <div className="coai-future-architecture" aria-hidden="true" />
      <div className="coai-future-horizon" aria-hidden="true" />
      <div className="coai-future-ring coai-future-ring-one animate-spin-slow" aria-hidden="true" />
      <div className="coai-future-ring coai-future-ring-two animate-spin-slow" aria-hidden="true" style={{ animationDirection: "reverse", animationDuration: "70s" }} />
      <div className="coai-hero-accent-glow" aria-hidden="true" />

      <div className="relative z-10 flex items-center gap-3 animate-reveal" aria-label="COAI">
        <CoaiMark size={58} variant="detailed" animated />
        <span className="font-display text-2xl font-semibold tracking-[0.22em] text-white sm:text-3xl">
          COAI
        </span>
      </div>

      <div
        className="coai-landing-promise relative z-10 flex w-full max-w-3xl flex-col items-center gap-5 rounded-[2rem] border px-5 pb-7 pt-8 backdrop-blur-md animate-reveal sm:px-12 sm:py-10"
        style={{ animationDelay: "120ms" }}
      >
        <h1 className="mx-auto w-full text-balance font-display text-[clamp(2.2rem,5.4vw,4rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-white">
          Ton entraînement. Ta nutrition. Ta récupération. <span className="coai-gradient-text">100% sur-mesure.</span>
        </h1>
        <p className="max-w-lg text-balance text-lg font-semibold text-laiton-200 sm:text-xl">
          Ajusté au jour le jour selon ta forme et ton emploi du temps — comme en coaching VIP.
        </p>
        <p className="max-w-lg text-base leading-7 text-graphite-300 sm:text-lg">
          Construit par un algorithme codé avec 17 ans d&apos;expérience terrain. Un coach diplômé
          suit, valide et reste disponible quand tu en as besoin.
        </p>
      </div>

      <div className="relative z-10 -mt-4 flex flex-col items-center gap-4 animate-reveal" style={{ animationDelay: "260ms" }}>
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
          <span className="w-full text-center text-sm font-medium text-graphite-500">
            2 min · gratuit · sans engagement
          </span>
        </div>
        <div className="flex flex-col items-center gap-2.5 sm:flex-row">
          <span className="flex items-center gap-2 rounded-full border border-laiton-400/40 bg-laiton-400/10 px-4 py-2 text-sm font-semibold text-laiton-200 shadow-[0_0_24px_-8px_rgba(201,162,98,0.6)]">
            <span className="text-laiton-300">✓</span>
            17+ ans d&apos;expertise terrain intégrés dans nos algorithmes
          </span>
          <span className="flex items-center gap-2 rounded-full border border-acier/40 bg-acier/10 px-4 py-2 text-sm font-semibold text-[#a9c6d4] shadow-[0_0_24px_-8px_rgba(91,130,150,0.55)]">
            <span className="text-[#a9c6d4]">✓</span>
            Sans engagement · Résiliable à tout moment
          </span>
        </div>
      </div>

      {/* Explication du parcours (16/08/2026, demande Anthony : "simple,
          efficace, une phrase pour expliquer chacun") — diagnostic d'abord,
          puis le choix du coach/formule, jamais l'inverse. */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-5 animate-reveal" style={{ animationDelay: "400ms" }}>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-graphite-500">
          1. Ton diagnostic offert <span className="text-laiton-300">→</span> 2. Tu choisis ton coach et ta formule
        </p>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-left backdrop-blur-md">
            <p className="text-sm font-semibold text-white">Impulsion</p>
            <p className="mt-1 text-xs leading-5 text-graphite-400">
              Ton programme généré par l&apos;algorithme, en un seul paiement de 19€.
            </p>
          </div>
          <div className="rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.06] px-5 py-4 text-left backdrop-blur-md">
            <p className="text-sm font-semibold text-laiton-200">Transformation — hybride</p>
            <p className="mt-1 text-xs leading-5 text-graphite-400">
              L&apos;IA génère, un coach diplômé d&apos;État valide et te suit dans la durée.
            </p>
          </div>
          <div className="rounded-2xl border border-acier/25 bg-acier/[0.06] px-5 py-4 text-left backdrop-blur-md">
            <p className="text-sm font-semibold text-[#a9c6d4]">VIP</p>
            <p className="mt-1 text-xs leading-5 text-graphite-400">
              Coaching 100% humain avec Anthony Darmon, présentiel ou visio.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
