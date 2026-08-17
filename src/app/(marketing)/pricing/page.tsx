import type { Metadata } from "next";
import Link from "next/link";
import { SubscribeButton } from "@/components/compte/subscribe-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { BackLink } from "@/components/marketing/back-link";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { OffreConsentGate } from "@/components/compte/offre-consent-gate";
import { TIERS, vipReservationHref } from "@/lib/pricing/tiers";

export const metadata: Metadata = {
  title: "Tarifs — Personal Training réimaginé | COAI",
  description: "Choisis le niveau d'attention dont tu as besoin : Impulsion, Transformation ou VIP.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage({ searchParams }: { searchParams?: { checkout?: string } }) {
  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <TrackConversion name="pricing_viewed" />
      <div className="w-full max-w-6xl pt-8"><BackLink /></div>
      <div className="max-w-4xl text-center">
        <SectionLabel>Personal Training, Reimagined</SectionLabel>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
          Ton Personal Trainer, toujours avec toi.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-graphite-300">
          Même exigence, trois niveaux d&apos;attention. L&apos;IA apporte la disponibilité et la rapidité ;
          l&apos;humain apporte le regard, la subtilité et les décisions importantes.
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold text-laiton-300">
          Des milliers de données analysées, enrichies par 17 ans d&apos;expertise terrain.
        </p>
      </div>

      {searchParams?.checkout === "cancel" && (
        <Card className="w-full max-w-4xl border-laiton-400/30 px-6 py-5 text-center">
          <p className="font-semibold text-white">Aucun abonnement n&apos;a été créé.</p>
          <p className="mt-1 text-sm text-graphite-300">Tu peux reprendre quand tu veux.</p>
        </Card>
      )}

      <div className="grid w-full max-w-7xl grid-cols-1 gap-5 lg:grid-cols-3">
        {TIERS.map((tier) => (
          <Card key={tier.nom} id={tier.nom.toLowerCase()} className={`flex flex-col gap-5 px-6 py-8 ${tier.mostPopular ? "border-laiton-400/80 shadow-[0_28px_90px_-45px_rgba(214,170,96,.75)] lg:-translate-y-3" : ""}`}>
            <div className="flex min-h-6 items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">{tier.eyebrow}</span>
              {tier.mostPopular && <Badge tone="warning">Offre phare</Badge>}
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-white">{tier.nom}</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <strong className="text-5xl tracking-[-0.05em] text-white">{tier.prix}</strong>
                <span className="text-sm text-graphite-400">{tier.suffixe}</span>
              </div>
              {tier.trial && <p className="mt-2 text-sm font-medium text-laiton-300">7 jours d&apos;essai</p>}
            </div>
            <p className="min-h-20 text-sm leading-6 text-graphite-300">{tier.description}</p>
            <ul className="space-y-3 text-sm leading-6 text-graphite-200">
              {tier.features.map((feature) => <li key={feature} className="flex gap-3"><span className="text-laiton-400">✓</span><span>{feature}</span></li>)}
            </ul>

            {tier.sessions && (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-widest text-laiton-300">Choisis ton rythme</p>
                {tier.sessions.map((session) => (
                  <OffreConsentGate key={session.count} resumeConditions={<>Abonnement VIP COAI de {session.prix}, résiliable à tout moment. Il inclut {session.label}. Les créneaux sont confirmés avec Anthony.</>}>
                    <SubscribeButton plan="PREMIUM" vipSessions={session.count} label={`${session.label} — ${session.prix}`} className="w-full" />
                  </OffreConsentGate>
                ))}
              </div>
            )}

            <div className="flex-1" />
            {!tier.sessions && (
              <OffreConsentGate resumeConditions={<>Abonnement COAI {tier.nom} à {tier.prix}/mois, résiliable à tout moment. {tier.trial ? "Les 7 premiers jours constituent une période d'essai ; la facturation mensuelle commence ensuite sauf résiliation." : "La facturation commence immédiatement."}</>}>
                <SubscribeButton plan={tier.plan} label={tier.trial ? (tier.mostPopular ? "Essayer Impulsion pendant 7 jours" : "Commencer mes 7 jours d'essai") : `Choisir ${tier.nom}`} className="coai-rainbow-cta w-full border-0 text-[#111216]" />
              </OffreConsentGate>
            )}

            {tier.plan === "PREMIUM" && (
              <a className="text-center text-sm font-semibold text-laiton-300 underline underline-offset-4" href={vipReservationHref("une transformation privée de longue durée", "sur devis") ?? "/vip"} target="_blank" rel="noreferrer">
                Parler d&apos;une transformation privée plus longue
              </a>
            )}
          </Card>
        ))}
      </div>

      <p className="max-w-2xl text-center text-xs leading-5 text-graphite-400">
        Abonnements mensuels sans engagement, résiliables à tout moment. VIP : visio partout ou présentiel à Paris centre, sous réserve de disponibilité. Voir les <Link href="/cgv" className="underline">CGV</Link>.
      </p>
    </main>
  );
}
