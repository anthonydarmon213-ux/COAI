import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { EnterpriseLeadForm } from "@/components/marketing/enterprise-lead-form";
import { TrackConversion } from "@/components/analytics/track-conversion";

export const metadata: Metadata = {
  title: "COAI Entreprise — Santé et performance des équipes",
  description: "Un accompagnement sport, nutrition et récupération piloté pour vos dirigeants et collaborateurs, avec mesure de l'engagement.",
  alternates: { canonical: "/entreprise" },
};

export default function EntreprisePage() {
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
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
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
          <div className="lg:sticky lg:top-28 lg:self-start"><p className="mb-5 font-mono text-[11px] uppercase tracking-[0.18em] text-laiton-200">Préparer votre pilote</p><EnterpriseLeadForm /></div>
        </div>
      </div>
    </main>
  );
}
