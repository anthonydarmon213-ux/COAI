import type { Metadata } from "next";
import Link from "next/link";
import { SubscribeButton } from "@/components/compte/subscribe-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { BackLink } from "@/components/marketing/back-link";
import { TrustBadges } from "@/components/marketing/trust-badges";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { OneShotProgrammeButton } from "@/components/programme/one-shot-programme-button";
import { OffreConsentGate } from "@/components/compte/offre-consent-gate";
import { TIERS, ENTREPRISE, VIP_MESSAGE, vipReservationHref } from "@/lib/pricing/tiers";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const TITLE = "Tarifs — COAI";
const DESCRIPTION =
  "Inscription gratuite, interface visible en entier. Débloque Impulsion (19€, paiement unique), Transformation (49€/mois, suivi coach), VIP à la séance avec Anthony Darmon, ou une offre Entreprise sur mesure.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/pricing" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function PricingPage({
  searchParams,
}: {
  searchParams?: { billing?: string; checkout?: string };
}) {
  const vipHref = buildWhatsAppLink(VIP_MESSAGE);
  // Le mensuel rassure davantage au premier contact. L'annuel reste une
  // option avantageuse, mais n'est plus imposé à l'arrivée sur la page.
  const annual = searchParams?.billing === "annual";
  const displayedTiers = TIERS.map((tier) => {
    // Impulsion (paiement unique) ne dépend jamais du bascule mensuel/annuel.
    if (!annual || tier.sessions || tier.oneShot) return tier;
    if (tier.nom === "Transformation") {
      return { ...tier, prix: "490€", suffixe: "/an", essai: "7 jours offerts · puis 490€/an" };
    }
    return tier;
  });

  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <TrackConversion name="pricing_viewed" />
      <div className="w-full max-w-5xl pt-8">
        <BackLink />
      </div>
      <div className="text-center">
        <SectionLabel>Tarifs</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Choisis le coaching qui te correspond.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-graphite-400">
          Dans les deux formules, ton programme personnalisé est inclus. Choisis simplement le
          niveau d&apos;accompagnement que tu souhaites.
        </p>
        <div className="mt-6 flex justify-center">
          <TrustBadges />
        </div>
        <div className="mt-6 inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          <Link href="/pricing?billing=monthly" className={`rounded-full px-4 py-2 text-sm ${!annual ? "bg-laiton-400 text-graphite-950" : "text-graphite-300"}`}>Mensuel</Link>
          <Link href="/pricing?billing=annual" className={`rounded-full px-4 py-2 text-sm ${annual ? "bg-laiton-400 text-graphite-950" : "text-graphite-300"}`}>Annuel · 2 mois offerts</Link>
        </div>
      </div>

      {searchParams?.checkout === "cancel" && (
        <Card className="w-full max-w-4xl border-laiton-400/30 bg-laiton-400/[0.06] px-6 py-5 text-center">
          <p className="font-semibold text-white">Ton inscription n&apos;a pas été finalisée.</p>
          <p className="mt-1 text-sm text-graphite-300">Aucun paiement n&apos;a été enregistré. Tu peux reprendre ci-dessous quand tu veux.</p>
        </Card>
      )}

      <div className="coai-pricing-algorithm w-full max-w-4xl rounded-2xl px-6 py-6 text-center sm:px-10">
        <SectionLabel>La différence COAI</SectionLabel>
        <h2 className="mt-3 font-display text-2xl font-semibold text-white sm:text-3xl">
          Bien plus qu&apos;un programme généré par une IA classique.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-graphite-300">
          Ton programme n&apos;est pas produit à partir d&apos;un simple prompt. Les algorithmes COAI
          traduisent plus de 17 ans d&apos;expérience terrain en décisions d&apos;entraînement, de
          nutrition et de récupération adaptées à ton profil.
        </p>
        <p className="mt-4 text-sm font-semibold text-laiton-300">
          L&apos;IA personnalise. Les algorithmes COAI structurent et adaptent. L&apos;expertise humaine valide et accompagne.
        </p>
      </div>

      {/* Comparateur à 4 colonnes (13/08/2026, nouveau modèle d'accès libre)
          — Entreprise réintégrée au grid, à côté de VIP, pour plus de
          visibilité (elle était auparavant sortie en bandeau à part). */}
      <div className="grid w-full max-w-5xl grid-cols-1 items-stretch gap-5 sm:grid-cols-2">
        {displayedTiers.map((tier) => (
          <Card
            id={tier.sessions ? "vip" : undefined}
            key={tier.nom}
            className={`flex h-full flex-col gap-5 px-6 py-8 text-center ${
              tier.mostPopular ? "border-laiton-400/40" : ""
            }`}
          >
            {/* 1. Badge éventuel */}
            <div className="flex min-h-5 items-center justify-center">
              {tier.mostPopular && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-laiton-400">
                  Le plus choisi
                </span>
              )}
              {tier.limitedSpots && <Badge tone="warning">Places limitées</Badge>}
            </div>

            {/* 2. Nom */}
            <h2 className="text-2xl font-semibold tracking-[-0.025em] text-white">{tier.nom}</h2>

            {/* 3. Prix */}
            {tier.sessions ? (
              <p className="text-lg font-semibold text-white">{tier.prix}</p>
            ) : (
              <div>
                <div className="flex items-baseline justify-center gap-1">
                  <p className="text-5xl font-semibold tracking-[-0.045em] text-white">{tier.prix}</p>
                  <span className="text-sm text-graphite-400">{tier.suffixe}</span>
                </div>
                {!tier.oneShot && annual && (
                  <p className="mt-2 text-xs font-medium text-emerald-300">
                    Économie de 98 € par an
                  </p>
                )}
                {!tier.oneShot && !annual && (
                  <Link href="/pricing?billing=annual" className="mt-2 block text-xs font-medium text-laiton-300 hover:text-laiton-200">
                    ou 490€/an · 2 mois offerts
                  </Link>
                )}
              </div>
            )}

            {/* 4. Description */}
            <p className="text-sm text-graphite-300">{tier.description}</p>

            {tier.nom === "Transformation" && (
              <div className="rounded-xl border border-laiton-400/30 bg-laiton-400/[0.08] px-4 py-3 text-left">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-laiton-300">
                  Tout Impulsion inclus, plus
                </p>
                <p className="mt-1 text-sm font-semibold leading-5 text-white">
                  L&apos;adaptation continue et la présence d&apos;un coach diplômé.
                </p>
              </div>
            )}

            {/* 5. Liste des bénéfices */}
            <ul className="flex w-full flex-col gap-2 text-left text-sm text-graphite-300">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-laiton-400">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {tier.sessions && (
              <div className="flex w-full flex-col gap-3 rounded-lg border border-graphite-800 bg-graphite-900/40 p-3 text-left text-sm">
                {tier.sessions.map((session) => {
                  const href = vipReservationHref(session.label, session.prix);
                  return (
                    <div key={session.label} className="flex flex-col gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-graphite-300">{session.label}</span>
                        <span className="font-semibold text-white">{session.prix}</span>
                      </div>
                      {href && (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="w-full">
                          <Button variant="secondary" size="compact" className="w-full">
                            Réserver via WhatsApp
                          </Button>
                        </a>
                      )}
                    </div>
                  );
                })}
                <p className="text-xs leading-5 text-graphite-400">
                  Réservation directe avec Anthony. Valable 3 mois. Report gratuit jusqu&apos;à 24 h
                  avant la séance ; passé ce délai, la séance est due.
                </p>
              </div>
            )}

            {/* 6. Espace flexible — pousse le CTA en bas, aligné entre
                cartes voisines de longueurs de contenu différentes, sans
                jamais imposer de hauteur fixe qui couperait le contenu. */}
            <div className="flex-1" />

            {/* 7. CTA + 8. information essai */}
            <div className="flex flex-col items-center gap-2">
              {tier.sessions ? (
                vipHref ? (
                  <a href={vipHref} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="ghost" className="w-full">Une question ? Écrire sur WhatsApp</Button>
                  </a>
                ) : (
                  <Button className="w-full" disabled>
                    Contacte ton coach pour réserver
                  </Button>
                )
              ) : tier.oneShot ? (
                <OffreConsentGate
                  resumeConditions={
                    <>
                      Je reconnais avoir pris connaissance des conditions de l&apos;offre
                      Impulsion : paiement unique de 19€, programme généré immédiatement. Je
                      demande le début immédiat du service et reconnais renoncer à mon droit de
                      rétractation de 14 jours pour la partie du service déjà utilisée.
                    </>
                  }
                >
                  <OneShotProgrammeButton label="Générer mon programme avec COAI — 19€" />
                </OffreConsentGate>
              ) : tier.plan ? (
                <OffreConsentGate
                  resumeConditions={
                    <>
                      Je reconnais avoir pris connaissance des conditions de l&apos;offre
                      Transformation : 7 jours d&apos;accès gratuit à compter de ce jour, puis
                      passage automatique à un abonnement de {annual ? "490€/an" : "49€/mois"},
                      sauf résiliation avant la fin des 7 jours. Je demande le début immédiat du
                      service et reconnais renoncer à mon droit de rétractation de 14 jours pour
                      la partie du service déjà utilisée durant la période offerte.
                    </>
                  }
                >
                  <SubscribeButton plan={tier.plan} billing={annual ? "ANNUAL" : "MONTHLY"} label="Générer mon programme + activer mon suivi" className="w-full" />
                </OffreConsentGate>
              ) : null}
              {tier.essai && <span className="text-sm font-medium text-laiton-300">{tier.essai}</span>}
            </div>
          </Card>
        ))}

        {/* Entreprise : structurellement différent (devis, pas d'abonnement)
            — réintégré au grid (13/08/2026), juste à côté de VIP plutôt
            qu'en bandeau séparé moins visible. */}
        <Card className="flex h-full flex-col gap-5 px-6 py-8 text-center">
          <div className="flex min-h-5 items-center justify-center" />
          <h2 className="text-2xl font-semibold tracking-[-0.025em] text-white">{ENTREPRISE.nom}</h2>
          <p className="text-sm text-graphite-300">{ENTREPRISE.description}</p>
          <ul className="flex w-full flex-col gap-2 text-left text-sm text-graphite-300">
            {ENTREPRISE.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-0.5 text-laiton-400">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="flex-1" />
          <div className="flex flex-col items-center gap-2">
            {ENTREPRISE.whatsappHref ? (
              <a href={ENTREPRISE.whatsappHref} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button className="w-full">Demander un devis via WhatsApp</Button>
              </a>
            ) : (
              <a href={ENTREPRISE.mailHref} className="w-full">
                <Button className="w-full">Demander un devis par mail</Button>
              </a>
            )}
            <a
              href={ENTREPRISE.siteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-laiton-400 underline hover:text-laiton-300"
            >
              En savoir plus →
            </a>
          </div>
        </Card>
      </div>

      <p className="max-w-xl text-center text-xs text-graphite-500">
        L&apos;inscription est gratuite et donne accès à toute l&apos;interface. Impulsion est un
        paiement unique, sans abonnement. Transformation inclut 7 jours offerts, puis est facturée
        au choix chaque mois ou chaque année, sans engagement, résiliable à tout moment depuis ton
        compte. Les séances VIP se réservent directement avec Anthony sur WhatsApp. En débloquant une offre, tu
        acceptes nos{" "}
        <Link href="/cgv" className="underline hover:text-laiton-400">
          CGV
        </Link>
        .
      </p>
    </main>
  );
}
