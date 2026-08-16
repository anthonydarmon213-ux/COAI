import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { VipApplicationForm } from "@/components/marketing/vip-application-form";
import { TrackConversion } from "@/components/analytics/track-conversion";

export const metadata: Metadata = {
  title: "COAI Privé — Transformation 90 jours",
  description: "Accompagnement privé de 90 jours avec Anthony Darmon : stratégie, entraînement, nutrition, récupération et suivi COAI quotidien.",
  alternates: { canonical: "/vip" },
};

const INCLUS = [
  ["Stratégie", "Un bilan complet pour identifier les vrais leviers de ta transformation."],
  ["Exécution", "Un protocole précis d'entraînement, de nutrition et de récupération."],
  ["Pilotage", "Des ajustements réguliers fondés sur tes résultats et ton quotidien."],
  ["Présence", "Anthony pour les décisions clés, COAI pour t'accompagner chaque jour."],
];

export default function VipPage() {
  return (
    <main className="coai-future-hero min-h-screen overflow-hidden px-6 pb-24 pt-32 sm:px-10">
      <TrackConversion name="vip_page_viewed" />
      <div className="coai-future-architecture" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-graphite-400 transition hover:text-white">← Retour à COAI</Link>

        <div className="mt-12 grid items-start gap-14 lg:grid-cols-[1fr_.82fr] lg:gap-20">
          <div>
            <SectionLabel>COAI Privé · 90 jours</SectionLabel>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl">
              Ta transformation ne sera plus laissée au hasard.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-graphite-300">
              Un accompagnement confidentiel et entièrement piloté pour les personnes qui veulent un résultat important, sans perdre des mois à tester seules.
            </p>

            <div className="mt-10 grid gap-px overflow-hidden rounded-[1.6rem] border border-white/[0.09] bg-white/[0.09] sm:grid-cols-2">
              {INCLUS.map(([titre, texte], index) => (
                <div key={titre} className="bg-[#0d0d0c]/95 p-6">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-laiton-300">0{index + 1}</span>
                  <h2 className="mt-3 font-semibold text-white">{titre}</h2>
                  <p className="mt-2 text-sm leading-6 text-graphite-400">{texte}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 border-l border-laiton-300/40 pl-6">
              <p className="font-editorial text-xl italic leading-8 text-white">
                « Une méthode claire, un haut niveau d&apos;exigence et quelqu&apos;un qui garde le cap avec toi. »
              </p>
              <p className="mt-3 text-sm text-graphite-400">Anthony Darmon · 17 ans d&apos;expérience terrain</p>
            </div>

            <div className="mt-10 flex items-end gap-3">
              <span className="font-display text-4xl font-semibold text-white">À partir de 2 500 €</span>
              <span className="pb-1 text-sm text-graphite-500">pour 90 jours</span>
            </div>
            <p className="mt-2 text-sm text-laiton-200">Nombre de nouveaux accompagnements volontairement limité.</p>
          </div>

          <div id="candidature" className="lg:sticky lg:top-28">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-laiton-200">Demande confidentielle</p>
            <VipApplicationForm />
          </div>
        </div>
      </div>
    </main>
  );
}
