import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { VipApplicationForm } from "@/components/marketing/vip-application-form";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Coaching VIP — À domicile, en entreprise, en club ou à distance",
  description: "Coaching VIP avec Anthony Darmon, à partir de 200 € la séance : à domicile, en entreprise, en club ou à distance. Entraînement, nutrition, récupération et suivi COAI quotidien.",
  alternates: { canonical: "/vip" },
};

const INCLUS = [
  ["Diagnostic privé", "Objectif, contraintes, douleurs, habitudes et données : Anthony construit le point de départ avec toi."],
  ["Plan sur mesure", "Entraînement, nutrition et récupération organisés autour de ton agenda et de ton objectif."],
  ["Ajustements continus", "Le plan évolue chaque semaine selon ta forme, tes retours, tes mesures et tes progrès."],
  ["Accès direct", "Anthony pilote les décisions importantes ; COAI t'accompagne et te guide chaque jour entre les rendez-vous."],
];

export default function VipPage() {
  const whatsappHref = buildWhatsAppLink(
    "Bonjour Anthony, je souhaite un devis pour un coaching VIP COAI."
  );

  return (
    <main className="coai-vip-page coai-future-hero min-h-screen overflow-hidden px-6 pb-24 pt-32 sm:px-10">
      <TrackConversion name="vip_page_viewed" />
      <div className="coai-future-architecture" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-graphite-400 transition hover:text-white">← Retour à COAI</Link>

        <div className="mt-12 grid items-start gap-14 lg:grid-cols-[1fr_.82fr] lg:gap-20">
          <div>
            <SectionLabel>Coaching VIP · sur devis</SectionLabel>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl">
              Ta transformation ne sera plus laissée au hasard.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-graphite-300">
              Anthony pilote personnellement ta transformation : bilan initial, programme sur
              mesure, rendez-vous privés, ajustements et suivi quotidien avec COAI. Chez toi, dans
              ton entreprise, en club ou à distance — tu sais quoi faire, quand le faire et pourquoi.
            </p>

            <div className="mt-8 rounded-2xl border border-laiton-300/25 bg-laiton-300/[0.07] px-6 py-5">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-laiton-200">Concrètement</p>
              <p className="mt-2 text-base font-semibold leading-7 text-white">
                Un objectif chiffré, une feuille de route claire, des points réguliers avec Anthony
                et un programme qui s&apos;adapte à ta vraie vie jusqu&apos;au résultat.
              </p>
            </div>

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
              <span className="font-display text-4xl font-semibold text-white">200 € la séance</span>
              <span className="pb-1 text-sm text-graphite-500">puis sur devis</span>
            </div>
            <p className="mt-2 text-sm text-laiton-200">Facture professionnelle fournie, déductible en frais d&apos;entreprise.</p>
            <p className="mt-1 text-sm text-graphite-400">Nombre de nouveaux accompagnements volontairement limité.</p>
            <a href="#candidature" className="mt-6 inline-flex rounded-full bg-laiton-400 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.05em] text-graphite-950 transition hover:bg-laiton-300 lg:hidden">
              Demander mon devis
            </a>
          </div>

          <div id="candidature" className="lg:sticky lg:top-28">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-laiton-200">Demande confidentielle</p>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-5 flex min-h-14 w-full items-center justify-center rounded-full border border-[#70c989]/40 bg-[#1f7a43] px-6 py-4 text-center text-sm font-extrabold uppercase tracking-[0.04em] text-white shadow-[0_18px_45px_-22px_rgba(37,211,102,.7)] transition hover:-translate-y-0.5 hover:bg-[#176b39]"
              >
                Échanger directement avec Anthony sur WhatsApp →
              </a>
            )}
            <p className="mb-5 text-center text-xs leading-5 text-graphite-400">
              Tu préfères expliquer ton objectif par message ? Écris-moi directement.
            </p>
            <VipApplicationForm />
          </div>
        </div>
      </div>
    </main>
  );
}
