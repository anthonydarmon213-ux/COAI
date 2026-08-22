"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const BENEFICES = [
  "Le coach quotidien « Aujourd'hui » : tu sais quoi faire, sans chercher",
  "Une IA explicable — tu sais toujours pourquoi ta séance a changé",
  "Le Coach IA disponible pendant ta séance, dans le contexte exact de ton exercice",
  "Validation humaine selon ta formule : l'humain garde le dernier mot quand ça compte",
];

export function CoaiIntro() {
  return (
    <section className="coai-future-hero coai-landing-hero relative min-h-screen overflow-hidden px-6 pb-16 pt-28 sm:px-10 sm:pt-36">
      <Image
        src="/coai-diagnostic-clean.png"
        alt=""
        fill
        priority
        quality={95}
        sizes="100vw"
        className="coai-palace-image object-cover object-center"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,9,9,.12)_0%,rgba(8,9,9,.08)_43%,rgba(8,9,9,.48)_67%,rgba(8,9,9,.78)_100%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,9,9,.22)_0%,transparent_48%,rgba(8,9,9,.72)_100%)]" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-end justify-end md:min-h-[650px] md:items-center">
        <div className="w-full max-w-xl animate-reveal rounded-[2rem] border border-laiton-300/20 bg-[#0b0b0a] p-6 text-left shadow-[0_35px_110px_rgba(0,0,0,.58)] sm:p-8 lg:p-10">
          <div className="mb-7 inline-flex max-w-full items-start gap-2 rounded-2xl border border-laiton-300/25 bg-laiton-300/[0.07] px-4 py-2 sm:rounded-full">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-laiton-300 shadow-[0_0_14px_rgba(221,193,145,.85)]" />
            <span className="text-[10px] font-semibold uppercase leading-4 tracking-[0.14em] text-laiton-200 sm:text-[11px] sm:tracking-[0.18em]">
              Algorithme nourri par 17 ans d’expérience · des milliers de personnes accompagnées
            </span>
          </div>

          {/* Recentré sur les dirigeants (21/08/2026, audit tunnel demandé
              par Anthony, points #1/#2 : "la page parle à presque tout le
              monde"... "une promesse ciblée convertit généralement mieux").
              Reprend le ciblage déjà défini dans le dossier de
              positionnement (35-65 ans, agenda instable, charge mentale) —
              jusqu'ici jamais porté par le titre principal de la home. Les
              pages SEO généralistes restent inchangées, seule l'entrée
              principale change de cible. */}
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
            Retrouve ton énergie et ta forme,
            <span className="mt-2 block text-laiton-200">malgré un agenda chargé.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg sm:leading-8">
            COAI construit chaque jour la séance la plus utile selon ton temps disponible, ta
            forme réelle et tes contraintes — pas un programme figé que tu dois faire tenir dans
            ton emploi du temps.
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
                Faire mon bilan initial offert
              </Button>
            </Link>
            <Link href="/pricing#impulsion" className="px-2 py-3 text-sm font-medium text-graphite-300 transition hover:text-white">
              Découvrir les accompagnements →
            </Link>
          </div>
          <p className="mt-3 text-xs text-graphite-500">Bilan initial en moins de 5 minutes · Score COAI personnalisé · aucune carte bancaire</p>
        </div>
      </div>

      <div className="relative z-10 mx-auto mt-20 grid w-full max-w-6xl grid-cols-1 border-y border-white/[0.08] sm:grid-cols-3">
        {[
          ["01", "Bilan initial offert", "Tes besoins, ton niveau et ton Score COAI."],
          ["02", "Pass IA pour commencer", "Ton programme et tes séances adaptatives."],
          ["03", "Tu évolues si nécessaire", "Coaching Hybride ou VIP selon l'attention souhaitée."],
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
