import type { Metadata } from "next";
import Link from "next/link";
import { SubscribeButton } from "@/components/compte/subscribe-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { BackLink } from "@/components/marketing/back-link";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { MembreFondateurBadge } from "@/components/marketing/membre-fondateur-badge";
import { FondateurTicker } from "@/components/marketing/fondateur-ticker";
import { TIERS, vipReservationHref } from "@/lib/pricing/tiers";

type PricingSearchParams = {
  checkout?: string;
  from?: string;
  selected?: string;
  billing?: string;
  vipSessions?: string;
};

function tierId(plan: string) {
  if (plan === "GRATUIT") return "pass-ia";
  if (plan === "STANDARD") return "coaching-hybride";
  return "vip";
}

const COMPARAISON_RAPIDE = [
  ["Pass IA", "Je veux avancer en autonomie", "IA 24h/24 · programme adaptatif"],
  ["Coaching Hybride", "Je veux aussi un regard humain", "Supervision et ajustements du coach"],
  ["VIP", "Je veux une attention maximale", "1 séance privée par mois incluse"],
] as const;

export const metadata: Metadata = {
  title: "Tarifs — Personal Training réimaginé | COAI",
  description: "Choisis le niveau d'attention dont tu as besoin : Pass IA, Coaching Hybride ou VIP.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage({ searchParams }: { searchParams?: PricingSearchParams }) {
  const selectedPlan = searchParams?.selected;
  const selectedBilling = searchParams?.billing === "ANNUAL" ? "ANNUAL" : "MONTHLY";
  const arriveApresCreation = searchParams?.from === "signup";

  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center gap-8 px-6 pb-20 pt-16 sm:pt-20">
      <TrackConversion name="pricing_viewed" />
      <FondateurTicker />
      <div className="w-full max-w-6xl"><BackLink /></div>
      <div className="max-w-4xl text-center">
        <SectionLabel>Étape 4 sur 7 · Choisis ta formule</SectionLabel>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
          Choisis ton niveau d&apos;accompagnement.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-graphite-300">
          Ton bilan et ton résultat sont enregistrés. Choisis maintenant la formule qui te correspond :
          l&apos;essai de 7 jours démarre ensuite, avant ta première séance.
        </p>
      </div>

      {arriveApresCreation && (
        <Card className="w-full max-w-4xl border-emerald-400/25 bg-emerald-400/[0.06] px-6 py-5 text-center">
          <p className="font-semibold text-white">✓ Ton compte gratuit est prêt.</p>
          <p className="mt-1 text-sm text-graphite-300">Aucun paiement n&apos;a encore été effectué.</p>
        </Card>
      )}

      {searchParams?.checkout === "cancel" && (
        <Card className="w-full max-w-4xl border-laiton-400/30 px-6 py-5 text-center">
          <p className="font-semibold text-white">Aucun abonnement n&apos;a été créé.</p>
          <p className="mt-1 text-sm text-graphite-300">Ton choix est conservé. Tu peux reprendre ici sans recommencer ton bilan.</p>
        </Card>
      )}

      <section className="w-full max-w-5xl" aria-labelledby="comparatif-rapide">
        <h2 id="comparatif-rapide" className="text-center text-sm font-semibold uppercase tracking-[0.16em] text-laiton-300">
          Choisir en 10 secondes
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {COMPARAISON_RAPIDE.map(([nom, besoin, niveau]) => (
            <a key={nom} href={`#${nom === "Pass IA" ? "pass-ia" : nom === "Coaching Hybride" ? "coaching-hybride" : "vip"}`} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-5 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:-translate-y-0.5 hover:border-laiton-400/45 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-laiton-400/60">
              <strong className="block text-base text-white">{nom}</strong>
              <span className="mt-1.5 block text-sm font-semibold text-laiton-300">{besoin}</span>
              <span className="mt-1 block text-xs leading-5 text-graphite-400">{niveau}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Deux cartes principales (22/08/2026, demande Anthony) — VIP sort
          de la grille et devient un lien d'upsell sous les cartes : à trois
          colonnes, l'offre à 199€/mois écrasait visuellement les deux
          offres réellement souscrites en ligne. */}
      <div className="grid w-full max-w-5xl scroll-mt-24 grid-cols-1 gap-5 lg:grid-cols-2">
        {TIERS.filter((tier) => tier.plan !== "PREMIUM").map((tier) => (
          <Card key={tier.nom} id={tierId(tier.plan)} className={`flex scroll-mt-24 flex-col gap-5 px-6 py-8 ${tier.mostPopular || selectedPlan === tier.plan ? "border-laiton-400/80 shadow-[0_28px_90px_-45px_rgba(214,170,96,.75)]" : ""}`}>
            <div className="flex min-h-6 items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">{tier.eyebrow}</span>
              {selectedPlan === tier.plan ? <Badge tone="warning">Ton choix</Badge> : tier.mostPopular && <Badge tone="warning">Offre phare</Badge>}
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-white">{tier.nom}</h2>
              <div className="mt-4 flex items-baseline gap-1">
                <strong className="text-5xl tracking-[-0.05em] text-white">{tier.prix}</strong>
                <span className="text-sm text-graphite-400">{tier.suffixe}</span>
              </div>
              {tier.trial && <p className="mt-2 text-sm font-medium text-laiton-300">7 jours d&apos;essai</p>}
              {tier.noteFacturation && <p className="mt-1 text-xs leading-5 text-graphite-500">{tier.noteFacturation}</p>}
            </div>
            {tier.founderOffer && <MembreFondateurBadge />}
            <p className="min-h-20 text-sm leading-6 text-graphite-300">{tier.description}</p>
            {tier.sessions && (
              <div className="space-y-4 rounded-2xl border border-laiton-300/20 bg-laiton-300/[0.05] p-5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-laiton-300">L’essentiel du VIP</p>
                  <p className="mt-2 text-sm font-semibold text-white">1 séance privée chaque mois</p>
                  <p className="mt-1 text-xs leading-5 text-graphite-400">En visio partout ou en présentiel à Paris centre.</p>
                </div>
                <SubscribeButton plan="PREMIUM" vipSessions={1} label="Choisir VIP — 199€/mois" className="coai-rainbow-cta w-full border-0" />
                <p className="text-center text-[11px] text-graphite-500">
                  En continuant, tu acceptes les <Link href="/cgv" target="_blank" className="underline">CGV</Link>.
                </p>
                <a className="block text-center text-xs font-semibold text-laiton-300 underline underline-offset-4" href={vipReservationHref("un rythme VIP de 2 à 4 séances par mois", "sur mesure") ?? "/vip"} target="_blank" rel="noreferrer">
                  Besoin de 2 à 4 séances par mois ? Parlons-en
                </a>
              </div>
            )}

            <div className="flex-1" />
            {!tier.sessions && (
              <>
                <SubscribeButton
                  plan={tier.plan}
                  label={tier.trial ? `Choisir ${tier.nom} · 7 jours offerts` : `Choisir ${tier.nom}`}
                  className="coai-rainbow-cta w-full border-0 text-[#111216]"
                />
                {/* Option annuelle (22/08/2026) — proposée uniquement sur
                    Pass IA : c'est le seul plan dont le checkout accepte
                    réellement les deux rythmes (cf. OFFER_BY_PLAN). */}
                {tier.plan === "GRATUIT" && (
                  <SubscribeButton
                    plan="GRATUIT"
                    billing="ANNUAL"
                    label="Choisir l'annuel · 119€/an"
                    className={`w-full border border-laiton-400/35 bg-laiton-400/10 text-laiton-200 ${selectedBilling === "ANNUAL" ? "ring-2 ring-laiton-300/60" : ""}`}
                  />
                )}
                {/* Réassurance sous le bouton (22/08/2026, demande
                    Anthony). Apple Pay / Google Pay apparaissent
                    automatiquement dans Stripe Checkout quand ils sont
                    activés côté dashboard Stripe — on ne les annonce donc
                    pas ici en dur, pour ne rien promettre que la page de
                    paiement n'afficherait pas réellement. */}
                <p className="text-center text-[11px] font-medium text-graphite-400">
                  🔒 Paiement sécurisé · Sans engagement · Annulation en 1 clic
                </p>
                <p className="text-center text-[11px] text-graphite-500">
                  En continuant, tu acceptes les <Link href="/cgv" target="_blank" className="underline">CGV</Link>
                  {tier.trial ? " — 7 jours d'essai, puis prélèvement sauf résiliation." : "."}
                </p>
              </>
            )}

            <ul className="space-y-3 text-sm leading-6 text-graphite-200">
              {tier.features.slice(0, 4).map((feature) => <li key={feature} className="flex gap-3"><span className="text-laiton-400">✓</span><span>{feature}</span></li>)}
            </ul>

            {tier.plan === "PREMIUM" && (
              <a className="text-center text-sm font-semibold text-laiton-300 underline underline-offset-4" href={vipReservationHref("une transformation privée de longue durée", "sur devis") ?? "/vip"} target="_blank" rel="noreferrer">
                Parler d&apos;une transformation privée plus longue
              </a>
            )}
          </Card>
        ))}
      </div>

      <div className="w-full max-w-5xl rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] px-5 py-4 text-center">
        <p className="text-sm font-semibold text-white">Étapes 5 à 7 : essai de 7 jours → programme activé → première séance</p>
        <p className="mt-1 text-xs text-graphite-400">Stripe demande un moyen de paiement, mais aucun prélèvement n&apos;est effectué avant la fin de l&apos;essai pour Pass IA et Coaching Hybride.</p>
      </div>

      <div className="w-full max-w-5xl rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
        <p className="text-sm text-graphite-200">
          Besoin d&apos;un accompagnement maximal, avec des séances privées ?
        </p>
        <a
          className="mt-1.5 inline-block text-sm font-semibold text-laiton-300 underline underline-offset-4"
          href={vipReservationHref("l'accompagnement VIP", "dès 199€/mois") ?? "/vip"}
          target="_blank"
          rel="noreferrer"
        >
          Découvrir VIP, dès 199€/mois →
        </a>
      </div>

      <p className="max-w-2xl text-center text-xs leading-5 text-graphite-400">
        Abonnements mensuels sans engagement, résiliables à tout moment. VIP : visio partout ou présentiel à Paris centre, sous réserve de disponibilité. Voir les <Link href="/cgv" className="underline">CGV</Link>.
      </p>
    </main>
  );
}
