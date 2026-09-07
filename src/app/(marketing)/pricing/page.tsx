import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { BackLink } from "@/components/marketing/back-link";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { StandardBilling } from "@/components/marketing/standard-billing";
import { prixTrimestreCentimes } from "@/lib/pricing/offre-rentree";
import { TIER_BY_SERVICE, vipReservationHref } from "@/lib/pricing/tiers";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Abonnements et accompagnements | COAI",
  description: "Compare COAI Essentiel, Premium Remote et VIP Présentiel : inclus, tarifs et modalités de facturation.",
  alternates: { canonical: "/pricing" },
};

function Benefits({ included, excluded }: { included: string[]; excluded: string[] }) {
  return (
    <div className="border-t border-white/10 pt-6">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-cyan-200">Inclus</h3>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
        {included.map(item => <li key={item} className="flex gap-3"><span aria-hidden="true" className="text-cyan-200">✓</span><span>{item}</span></li>)}
      </ul>
      <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-400">Non inclus</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
        {excluded.map(item => <li key={item} className="flex gap-3"><span aria-hidden="true">—</span><span>{item}</span></li>)}
      </ul>
    </div>
  );
}

export default function PricingPage({ searchParams }: { searchParams?: { checkout?: string; from?: string; selected?: string; billing?: string; vipSessions?: string } }) {
  const billing = searchParams?.billing === "ANNUAL" ? "ANNUAL" : searchParams?.billing === "QUARTERLY" ? "QUARTERLY" : "MONTHLY";
  const remote = TIER_BY_SERVICE.TRANSFORMATION;
  const vip = TIER_BY_SERVICE.VIP;
  return (
    <main className="coai-landing-lux min-h-screen px-5 pb-20 pt-12 sm:px-8">
      <TrackConversion name="pricing_viewed" />
      <div className="mx-auto max-w-6xl">
        <BackLink />
        <header className="mx-auto mb-10 mt-8 max-w-3xl text-center">
          <SectionLabel>Les accompagnements COAI</SectionLabel>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Ta meilleure forme.<br /><span className="text-cyan-200">À ton rythme, avec le bon suivi.</span></h1>
          <p className="mt-5 text-base leading-7 text-slate-300">Entraînement, alimentation et récupération. Choisis ton programme en autonomie, un coach à distance ou des séances privées.</p>
        </header>
        {searchParams?.from === "signup" && <p className="mb-6 rounded-2xl border border-cyan-300/30 bg-cyan-300/5 p-4 text-center text-slate-200">Ton compte est prêt. Aucun paiement n’a encore été effectué. Ton choix de facturation COAI Essentiel est conservé ci-dessous.</p>}
        {searchParams?.checkout === "cancel" && <p className="mb-6 rounded-2xl border border-white/20 p-4 text-center text-slate-200">Tu as quitté le paiement. Tu peux revoir ton choix ci-dessous.</p>}
        <p className="mb-6 text-center text-sm text-slate-300">Mensuel ou annuel pour COAI Essentiel. Les accompagnements Remote et VIP sont des packs sur devis.</p>

        <div className="grid items-start gap-6 xl:grid-cols-3">
          <section id="pass-ia" aria-labelledby="standard-title" className="scroll-mt-24 overflow-hidden rounded-3xl border border-cyan-200/40 bg-slate-950/60">
            <p className="bg-cyan-200/10 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-cyan-100">01 · En autonomie</p>
            <div className="space-y-6 p-6">
              <div><h2 id="standard-title" className="text-3xl font-semibold text-white">COAI Essentiel</h2><p className="mt-3 text-sm leading-6 text-slate-300">Ton programme personnalisé et tes repères pour progresser au quotidien.</p></div>
              <StandardBilling initialBilling={billing} quarterlyPrice={prixTrimestreCentimes() / 100} />
              <Benefits included={["Programme personnalisé à partir de ton bilan", "Adaptation des séances à ta forme et au temps disponible", "Coach IA disponible 24 h/24", "Repères d’alimentation et de récupération", "Suivi des séances, charges et progression"]} excluded={["Suivi individuel régulier par un coach humain", "Séances privées en présentiel"]} />
            </div>
          </section>

          <section id="full-remote" aria-labelledby="remote-title" className="scroll-mt-24 overflow-hidden rounded-3xl border border-laiton-300/40 bg-slate-950/60">
            <p className="bg-laiton-300/10 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-laiton-200">02 · Avec ton coach à distance</p>
            <div className="space-y-6 p-6">
              <div><h2 id="remote-title" className="text-3xl font-semibold text-white">{remote.nom}</h2><p className="mt-3 text-sm leading-6 text-slate-300">Ta transformation physique accompagnée personnellement par Anthony, à distance.</p></div>
              <div><p className="text-5xl font-semibold text-white">{remote.prix}</p><p className="mt-2 text-base text-slate-200">Le pack de 3 mois</p><p className="mt-3 text-sm leading-6 text-slate-300">Payé en une fois à la signature. Accompagnement de 6 mois : 1 920 €. Ce n’est pas un abonnement mensuel.</p></div>
              <a href={vipReservationHref(remote.devisWhatsappLabel, remote.devisPriceLabel) ?? "/vip"} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center rounded-full bg-laiton-200 px-5 py-3 text-center text-sm font-bold text-slate-950">Échanger sur mon accompagnement</a>
              <Benefits included={remote.features.slice(0, 5)} excluded={["Séances privées en présentiel", "Accès illimité aux créneaux du coach"]} />
              <p className="text-xs leading-5 text-slate-400">Sur devis, selon les disponibilités. Objectifs et modalités définis ensemble avant engagement.</p>
            </div>
          </section>

          <section id="full-presentiel" aria-labelledby="vip-title" className="scroll-mt-24 overflow-hidden rounded-3xl border border-white/20 bg-slate-950/60">
            <p className="bg-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-laiton-200">03 · Avec ton coach en présentiel</p>
            <div className="space-y-6 p-6">
              <div><h2 id="vip-title" className="text-3xl font-semibold text-white">{vip.nom}</h2><p className="mt-3 text-sm leading-6 text-slate-300">Tes séances privées avec Anthony, pour un accompagnement au plus près de toi.</p></div>
              <div><p className="text-5xl font-semibold text-white">{vip.prix}</p><p className="mt-2 text-base text-slate-200">Le pack de 3 mois · particulier</p><p className="mt-3 text-sm leading-6 text-slate-300">Payé en une fois à la signature. Environ une séance par semaine. Pack de 6 mois : 2 400 €.</p></div>
              <a href={vipReservationHref(vip.devisWhatsappLabel, vip.devisPriceLabel) ?? "/vip"} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center rounded-full bg-laiton-200 px-5 py-3 text-center text-sm font-bold text-slate-950">Demander mon devis VIP</a>
              <Benefits included={vip.features.slice(0, 3)} excluded={["Séances supplémentaires hors du pack convenu", "Séances à l’unité, hors séance d’essai"]} />
              <details className="border-t border-white/10 pt-4 text-sm text-slate-300">
                <summary className="cursor-pointer">Essai et tarif entreprise</summary>
                <p className="mt-3 leading-6">Particulier : 100 € TTC par séance, soit 1 200 € pour le pack de 3 mois. Entreprise : 200 € HT par séance + TVA 20 %, soit 240 € TTC. Facture fournie.</p>
                {vip.devisSecondaryCta && <a href={buildWhatsAppLink(vip.devisSecondaryCta.whatsappMessage) ?? "/vip"} target="_blank" rel="noreferrer" className="mt-3 block text-laiton-200 underline">{vip.devisSecondaryCta.label}</a>}
              </details>
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-cyan-200/20 bg-cyan-200/5 p-6 text-center">
          <h2 className="text-xl font-semibold text-white">Déjà inclus gratuitement dans COAI</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300">Ton bilan de forme, le carnet de séances, le suivi des charges et les bibliothèques d’exercices et de recettes. Ces fonctions restent accessibles sans abonnement.</p>
          <Link href="/fonctionnalites" className="mt-4 inline-block font-semibold text-cyan-200 underline underline-offset-4">Comparer les fonctions gratuites et payantes →</Link>
          <Link href="/dashboard" className="mt-3 block text-sm text-slate-200 underline underline-offset-4">Explorer gratuitement, sans carte bancaire</Link>
        </section>
        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-6 text-slate-400">COAI Essentiel : renouvellement selon la période choisie, résiliable avant le prochain renouvellement. Remote et VIP : engagement de 3 ou 6 mois sur devis, selon les disponibilités. Les conditions applicables sont précisées avant tout paiement. <Link href="/cgv" className="underline">Lire les CGV</Link>.</p>
      </div>
    </main>
  );
}
