"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const BENEFICES = [
  "Un plan adapté à ton corps et à ton emploi du temps",
  "Chaque séance s'ajuste au temps disponible et à ta forme du jour",
  "Entraînement, nutrition et récupération réunis",
  "Une recommandation claire, sans engagement",
];

export function CoaiIntro() {
  return (
    <section className="coai-future-hero coai-landing-hero relative min-h-screen overflow-hidden px-6 pb-16 pt-28 sm:px-10 sm:pt-36">
      <Image
        src="/coai-diagnostic.JPEG"
        alt=""
        fill
        priority
        sizes="100vw"
        className="coai-palace-image object-cover object-center"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,9,9,.12)_0%,rgba(8,9,9,.08)_43%,rgba(8,9,9,.48)_67%,rgba(8,9,9,.78)_100%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,9,.22)_0%,transparent_48%,rgba(8,9,9,.72)_100%)]" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-end justify-end md:min-h-[650px] md:items-center">
        <div className="max-w-xl animate-reveal rounded-[2rem] border border-white/[0.12] bg-black/55 p-6 text-left shadow-[0_35px_110px_rgba(0,0,0,.42)] backdrop-blur-sm sm:p-8 lg:p-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-laiton-300/25 bg-laiton-300/[0.07] px-4 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-laiton-300 shadow-[0_0_14px_rgba(221,193,145,.85)]" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-laiton-200">
              Coaching intelligent · expertise humaine
            </span>
          </div>

          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
            Ton corps n&apos;a pas besoin de plus d&apos;informations.
            <span className="mt-2 block text-laiton-200">Il a besoin du bon plan.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg sm:leading-8">
            COAI identifie ce qui bloque ta progression et construit la stratégie la plus adaptée
            pour atteindre ton objectif — avec le niveau d&apos;accompagnement dont tu as réellement besoin.
          </p>

          <ul className="mt-7 space-y-3" aria-label="Ce que comprend le diagnostic">
            {BENEFICES.map((benefice) => (
              <li key={benefice} className="flex items-start gap-3 text-sm text-graphite-200 sm:text-base">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-laiton-300/35 text-[11px] text-laiton-200">✓</span>
                <span>{benefice}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link href="/diagnostic">
              <Button className="px-8 py-4 text-sm font-bold uppercase tracking-[0.055em] shadow-[0_22px_65px_-18px_rgba(201,162,98,.75)] sm:text-base">
                Faire mon diagnostic offert
              </Button>
            </Link>
            <Link href="/vip" className="px-2 py-3 text-sm font-medium text-graphite-300 transition hover:text-white">
              Découvrir l&apos;accompagnement privé →
            </Link>
          </div>
          <p className="mt-3 text-xs text-graphite-500">3 minutes · résultat personnalisé · aucune carte bancaire</p>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-20 grid w-full max-w-6xl grid-cols-1 border-y border-white/[0.08] sm:grid-cols-3">
        {[
          ["01", "Diagnostic", "Nous trouvons les vrais freins."],
          ["02", "Prescription", "COAI recommande la bonne stratégie."],
          ["03", "Progression", "Le plan évolue avec tes résultats."],
        ].map(([numero, titre, texte]) => (
          <div key={numero} className="border-white/[0.08] px-6 py-6 text-left sm:border-r sm:last:border-r-0">
            <span className="font-mono text-[10px] tracking-[0.18em] text-laiton-300">{numero}</span>
            <p className="mt-2 font-semibold text-white">{titre}</p>
            <p className="mt-1 text-sm text-graphite-400">{texte}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
