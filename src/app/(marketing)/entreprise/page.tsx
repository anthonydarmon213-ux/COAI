import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { EnterpriseLeadForm } from "@/components/marketing/enterprise-lead-form";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "COAI Entreprise — Santé et performance des équipes",
  description: "Un accompagnement sport, nutrition et récupération piloté pour vos dirigeants et collaborateurs, avec mesure de l'engagement.",
  alternates: { canonical: "/entreprise" },
};

export default function EntreprisePage() {
  const whatsappHref = buildWhatsAppLink(
    "Bonjour Anthony, je souhaite échanger avec vous au sujet d’un dispositif COAI pour mon entreprise."
  );

  return (
    <main className="coai-future-hero min-h-screen px-6 pb-24 pt-32 sm:px-10">
      <TrackConversion name="enterprise_page_viewed" />
      <div className="coai-future-architecture" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <Link href="/" className="text-sm text-graphite-400 hover:text-white">← Retour à COAI</Link>
        <div className="mt-12 grid gap-16 lg:grid-cols-[1.05fr_.8fr]">
          <div>
            <SectionLabel>COAI Entreprise</SectionLabel>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl">Des équipes en meilleure forme. Une entreprise plus performante.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-graphite-300">COAI personnalise l&apos;entraînement, la nutrition et la récupération de chaque collaborateur, tout en donnant à l&apos;entreprise une vision claire de l&apos;engagement — jamais des données de santé individuelles.</p>

            <div className="mt-10 rounded-2xl border border-white/[0.09] bg-white/[0.035] p-6 sm:p-7">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">Pour vous, dirigeant(e)</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">Commencez dès aujourd&apos;hui, sans attendre le déploiement de l&apos;offre équipe.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-graphite-300">
                Avant de penser à vos équipes, prenez soin de vous : l&apos;abonnement individuel COAI est accessible
                immédiatement, en libre-service, avec le même diagnostic et le même moteur d&apos;adaptation que le
                dispositif entreprise.
              </p>
              <Link
                href="/diagnostic"
                className="mt-5 inline-flex min-h-12 items-center rounded-full bg-laiton-400 px-6 text-sm font-semibold text-graphite-950 transition hover:bg-laiton-300"
              >
                Faire mon diagnostic offert →
              </Link>
            </div>

            <p className="mt-12 font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">Pour vos collaborateurs — sur devis</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {[
                ["Pilote", "Un groupe restreint pour valider l'adoption."],
                ["Déploiement", "Un parcours personnalisé par collaborateur."],
                ["Pilotage", "Un bilan agrégé pour mesurer l'engagement."],
              ].map(([title, text], index) => <div key={title} className="rounded-2xl border border-white/[0.09] bg-white/[0.035] p-5"><span className="font-mono text-[10px] text-laiton-300">0{index + 1}</span><h2 className="mt-3 font-semibold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-graphite-400">{text}</p></div>)}
            </div>
            <div className="mt-10 rounded-2xl border border-laiton-300/20 bg-laiton-300/[0.055] p-6">
              <p className="text-sm font-semibold text-laiton-200">Modèle conçu pour grandir</p>
              <p className="mt-2 text-sm leading-6 text-graphite-300">Licence par collaborateur, onboarding automatisé et accompagnement premium des dirigeants : le dispositif s&apos;adapte de 10 à plusieurs centaines de personnes.</p>
            </div>
          </div>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-laiton-200">Préparer votre pilote</p>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-5 flex min-h-14 w-full items-center justify-center rounded-full border border-[#70c989]/40 bg-[#1f7a43] px-6 py-4 text-center text-sm font-extrabold uppercase tracking-[0.04em] text-white shadow-[0_18px_45px_-22px_rgba(37,211,102,.7)] transition hover:-translate-y-0.5 hover:bg-[#176b39]"
              >
                Échanger sur votre projet via WhatsApp →
              </a>
            )}
            <p className="mb-5 text-center text-xs leading-5 text-graphite-400">
              Un projet précis ? Présentez-le directement à Anthony par message.
            </p>
            <EnterpriseLeadForm />
          </div>
        </div>
      </div>
    </main>
  );
}
