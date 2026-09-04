import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { AppelDecouverteForm } from "@/components/marketing/appel-decouverte-form";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const TITLE = "Appel découverte avec Anthony Darmon — COAI";
const DESCRIPTION =
  "Un échange direct avec Anthony Darmon, coach diplômé d'État, pour comprendre ton objectif et voir quel accompagnement te correspond. Sans engagement.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/appel-decouverte" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/appel-decouverte" },
};

// Page creee le 04/09/2026 (demande Anthony : « fais le formulaire ou le
// WhatsApp »), sur le modele de charlesdenis.fr : tous ses boutons menent a
// une candidature (telephone, prenom, nom) puis a un creneau d'appel, jamais
// a une grille tarifaire.
//
// Aucun prix sur cette page, volontairement — meme decision que pour la home
// le meme jour : le tarif se presente apres le bilan et apres avoir vu
// l'application, pas avant. Le lien vers les accompagnements reste malgre
// tout accessible en bas de page : quelqu'un qui cherche un prix et ne le
// trouve nulle part s'en va, il ne remplit pas un formulaire.
export default function AppelDecouvertePage() {
  const whatsappHref = buildWhatsAppLink(
    "Bonjour Anthony, j’aimerais réserver un appel découverte avec vous pour parler de mon objectif et voir quel accompagnement me correspond."
  );

  return (
    <main className="coai-future-hero min-h-screen px-6 pb-24 pt-32 sm:px-10">
      <TrackConversion name="appel_decouverte_page_viewed" />
      <div className="coai-future-architecture" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-graphite-400 transition hover:text-white">
          ← Retour à COAI
        </Link>

        <div className="mt-12 grid gap-14 lg:grid-cols-[1fr_.9fr]">
          <div>
            <SectionLabel>Appel découverte</SectionLabel>
            <h1 className="mt-6 max-w-2xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-5xl">
              On parle de ton objectif avant de parler de méthode.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-graphite-300">
              Un échange direct avec Anthony — coach diplômé d&apos;État, 17 ans auprès de
              dirigeants. Pas un argumentaire de vente : de quoi comprendre où tu en es, ce
              qui a échoué jusqu&apos;ici et ce qui tiendrait dans ton agenda.
            </p>

            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {[
                ["Ce qu'on regarde", "Ton objectif réel, ton temps disponible, tes contraintes physiques et ton historique."],
                ["Ce que tu repars avec", "Une direction claire, applicable dès la semaine suivante, même si tu ne travailles pas avec Anthony."],
                ["Durée", "Une vingtaine de minutes, par téléphone ou en visio."],
                ["Engagement", "Aucun. Anthony te dit franchement si COAI est adapté à ta situation — ou non."],
              ].map(([titre, texte]) => (
                <li key={titre} className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5">
                  <p className="text-sm font-semibold text-laiton-200">{titre}</p>
                  <p className="mt-2 text-sm leading-6 text-graphite-400">{texte}</p>
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-2xl border border-white/[0.09] bg-white/[0.035] p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">
                Tu préfères juger sur le terrain
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-graphite-300">
                Une séance d&apos;essai avec Anthony est possible avant de t&apos;engager. Elle est
                payante et déduite de ton accompagnement si tu continues.
              </p>
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-full border border-[#70c989]/40 bg-[#1f7a43] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#176b39]"
                >
                  En parler directement sur WhatsApp →
                </a>
              )}
            </div>

            <p className="mt-8 text-sm leading-6 text-graphite-500">
              Tu veux d&apos;abord voir les tarifs ?{" "}
              <Link href="/pricing" className="underline decoration-white/25 underline-offset-4 transition hover:text-white">
                Le détail des trois accompagnements est ici
              </Link>
              .
            </p>
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-laiton-200">
              Demander mon appel
            </p>
            <AppelDecouverteForm />
          </div>
        </div>
      </div>
    </main>
  );
}
