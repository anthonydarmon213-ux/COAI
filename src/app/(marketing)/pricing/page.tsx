import type { Metadata } from "next";
import Link from "next/link";
import { SubscribeButton } from "@/components/compte/subscribe-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { CompteAReboursRentree } from "@/components/marketing/compte-a-rebours-rentree";
import { FIN_OFFRE_TRIMESTRE_LIBELLE, offreTrimestreActive, prixTrimestreCentimes } from "@/lib/pricing/offre-rentree";
import { BackLink } from "@/components/marketing/back-link";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { MembreFondateurBadge } from "@/components/marketing/membre-fondateur-badge";
import { FondateurTicker } from "@/components/marketing/fondateur-ticker";
import { TIERS, TIER_BY_SERVICE, vipReservationHref } from "@/lib/pricing/tiers";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type PricingSearchParams = {
  checkout?: string;
  from?: string;
  selected?: string;
  billing?: string;
  vipSessions?: string;
};

function tierId(plan: string) {
  if (plan === "PASS_IA") return "pass-ia";
  if (plan === "STANDARD") return "full-remote";
  return "full-presentiel";
}

// Ordre humain -> IA (04/09/2026, cf. commentaire sur la carte VIP plus bas).
const COMPARAISON_RAPIDE = [
  ["VIP Présentiel", "Je veux une attention maximale", "1 200 €/3 mois minimum (soit 100 €/séance)"],
  ["Premium Remote", "Je veux un coaching 1:1 à distance", "960 €/3 mois minimum (soit 80 €/séance)"],
  ["Standard IA", "Je veux avancer en autonomie", "IA 24h/24 · WhatsApp si besoin"],
] as const;

export const metadata: Metadata = {
  title: "Tarifs — Personal Training réimaginé | COAI",
  description: "Choisis le niveau d'attention dont tu as besoin : Standard IA, Premium Remote ou VIP Présentiel.",
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
        <SectionLabel>Choisis ton accompagnement</SectionLabel>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
          Choisis ton niveau d&apos;accompagnement.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-graphite-300">
          Ton bilan et ton résultat sont enregistrés. Choisis maintenant l&apos;accompagnement qui te correspond.
          Standard IA inclut 7 jours d&apos;essai ; Premium Remote et VIP Présentiel se confirment sur devis, via WhatsApp.
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
            <a key={nom} href={`#${nom === "Standard IA" ? "pass-ia" : nom === "Premium Remote" ? "full-remote" : "full-presentiel"}`} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-5 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:-translate-y-0.5 hover:border-laiton-400/45 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-laiton-400/60">
              <strong className="block text-base text-white">{nom}</strong>
              <span className="mt-1.5 block text-sm font-semibold text-laiton-300">{besoin}</span>
              <span className="mt-1 block text-xs leading-5 text-graphite-400">{niveau}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Deux cartes principales (22/08/2026, demande Anthony) — VIP sort
          de la grille et devient un lien d'upsell sous les cartes : à trois
          colonnes, le VIP écrasait visuellement les deux offres réellement
          souscrites en ligne. Depuis le 02/09/2026 il n'est plus vendu par
          abonnement : pack de séances (100 €/séance particulier, 200 €/séance
          entreprise sur devis) conclu sur WhatsApp. */}
      {/* Sortie gratuite (02/09/2026, demande Anthony — "je ne peux pas entrer
          sans prendre un abo ?"). Le tunnel du diagnostic proposait bien
          l'entree libre, mais quiconque arrivait ici par le menu ou par un
          lien externe ne voyait que des boutons payants : la page ressemblait
          a un mur alors que l'application est ouverte sans carte bancaire. */}
      <div className="w-full max-w-5xl rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] px-5 py-4 text-center">
        <p className="text-sm font-semibold text-white">
          Tu peux entrer dans l&apos;application sans payer.
        </p>
        <p className="mx-auto mt-1 max-w-2xl text-xs leading-5 text-graphite-300">
          Dix fonctions sont gratuites, sans carte bancaire : suivi de tes séances,
          RepCount, records, mesures, bibliothèque d&apos;exercices et recettes. Tu
          choisiras un accompagnement seulement si tu veux aller plus loin.
        </p>
        <Link
          href="/dashboard"
          className="mt-3 inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/10 px-6 py-2.5 text-sm font-bold text-cyan-100"
        >
          Entrer dans l&apos;application →
        </Link>
      </div>

      <CompteAReboursRentree className="w-full max-w-5xl" />

      {/* Ordre inverse le 04/09/2026 (demande Anthony : « mets l'accent sur
          l'humain d'abord, et si la personne n'a pas les moyens, guide-la
          vers l'IA »). La page listait les offres du moins cher au plus cher,
          donc l'IA en premier : le visiteur voyait l'offre sans coach avant
          d'avoir vu Anthony. VIP Presentiel ouvre desormais la page, Standard
          IA ferme la marche comme porte d'entree. */}
      {/* Le Full Présentiel VIP ne se souscrit pas en ligne : il sort donc de
          la grille des abonnements et devient une carte a part, conclue sur
          WhatsApp — comme Full Remote (cf. tier.sessions plus haut). Tarif
          entreprise (200 €/séance) volontairement absent d'ici (04/09/2026,
          décision Anthony) : seul le tarif particulier (100 €) est public,
          l'entreprise reste sur devis via WhatsApp. Prix affiché = total du
          pack 3 mois, pas le prix/séance (même jour, "on ne vend pas des
          séances on vend une transformation") — champs repris directement de
          TIER_BY_SERVICE.VIP pour ne jamais diverger de tiers.ts. */}
      <div className="w-full max-w-5xl rounded-2xl border border-laiton-300/25 bg-laiton-300/[0.05] px-6 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">
              {TIER_BY_SERVICE.VIP.eyebrow}
            </p>
            {/* Nom de l'offre ajoute le 04/09/2026 : cette carte n'affichait
                que son sur-titre puis le prix, jamais « VIP Presentiel ».
                Passable tant qu'elle fermait la page apres les deux autres
                cartes nommees ; intenable maintenant qu'elle l'ouvre — le
                visiteur tombait sur 1 200 EUR sans savoir de quelle offre il
                s'agit. Meme niveau de titre que les deux autres cartes. */}
            <h2 className="mt-2 text-3xl font-semibold text-white">{TIER_BY_SERVICE.VIP.nom}</h2>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-semibold text-white">{TIER_BY_SERVICE.VIP.prix}</span>
              <span className="text-sm text-graphite-400">{TIER_BY_SERVICE.VIP.suffixe}</span>
            </div>
            {TIER_BY_SERVICE.VIP.noteFacturation && (
              <p className="mt-1 text-xs text-graphite-500">{TIER_BY_SERVICE.VIP.noteFacturation}</p>
            )}
            <p className="mt-3 max-w-md text-sm leading-6 text-graphite-300">
              Séances privées avec Anthony, à domicile, en entreprise, en club ou à
              distance — environ 1 séance par semaine. Tarif entreprise et accompagnements
              suivis sur devis.
            </p>
            <p className="mt-2 text-sm text-laiton-200">
              Facture professionnelle fournie, déductible en frais d&apos;entreprise.
            </p>
          </div>
          <div className="shrink-0 space-y-2">
            <a
              className="coai-rainbow-cta flex items-center justify-center rounded-full border-0 px-7 py-3.5 text-center text-sm font-bold text-graphite-950"
              href={vipReservationHref(TIER_BY_SERVICE.VIP.devisWhatsappLabel ?? TIER_BY_SERVICE.VIP.nom, TIER_BY_SERVICE.VIP.devisPriceLabel ?? `${TIER_BY_SERVICE.VIP.prix} ${TIER_BY_SERVICE.VIP.suffixe}`) ?? "/vip"}
              target="_blank"
              rel="noreferrer"
            >
              Demander mon devis sur WhatsApp
            </a>
            {TIER_BY_SERVICE.VIP.devisSecondaryCta && (
              <a
                className="flex items-center justify-center rounded-full border border-laiton-300/35 bg-laiton-300/[0.06] px-7 py-3.5 text-center text-sm font-semibold text-laiton-200 transition hover:bg-laiton-300/[0.1]"
                href={buildWhatsAppLink(TIER_BY_SERVICE.VIP.devisSecondaryCta.whatsappMessage) ?? "/vip"}
                target="_blank"
                rel="noreferrer"
              >
                {TIER_BY_SERVICE.VIP.devisSecondaryCta.label}
              </a>
            )}
            <p className="text-center text-[11px] text-graphite-500">
              Réponse directe · places extrêmement limitées
            </p>
          </div>
        </div>
      </div>

      <div className="grid w-full max-w-5xl scroll-mt-24 grid-cols-1 gap-5 lg:grid-cols-2">
        {[...TIERS.filter((tier) => tier.plan !== "PREMIUM")].reverse().map((tier) => (
          <Card key={tier.nom} id={tierId(tier.plan)} className={`flex scroll-mt-24 flex-col gap-5 px-6 py-8 ${tier.mostPopular || selectedPlan === tier.plan ? "border-laiton-400/80 shadow-[0_28px_90px_-45px_rgba(214,170,96,.75)]" : ""}`}>
            <div className="flex min-h-6 items-center justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">{tier.eyebrow}</span>
              {selectedPlan === tier.plan ? (
                <Badge tone="warning">
                  {tier.plan === "PASS_IA" && selectedBilling === "ANNUAL" ? "Ton choix · annuel" : "Ton choix"}
                </Badge>
              ) : tier.mostPopular && <Badge tone="warning">Offre phare</Badge>}
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
                  <p className="text-xs uppercase tracking-widest text-laiton-300">{tier.nom}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{tier.devisPriceLabel ?? `${tier.prix} ${tier.suffixe}, puis sur devis`}</p>
                  <p className="mt-1 text-xs leading-5 text-graphite-400">{tier.devisTagline}</p>
                </div>
                <a
                  className="coai-rainbow-cta flex w-full items-center justify-center rounded-full border-0 px-6 py-3.5 text-center text-sm font-bold text-graphite-950"
                  href={vipReservationHref(tier.devisWhatsappLabel ?? tier.nom, tier.devisPriceLabel ?? `${tier.prix} ${tier.suffixe}, puis sur devis`) ?? "/vip"}
                  target="_blank"
                  rel="noreferrer"
                >
                  {tier.devisSecondaryCta ? "Souscrire directement sur WhatsApp" : "Demander mon devis sur WhatsApp"}
                </a>
                {tier.devisSecondaryCta && (
                  <a
                    className="flex w-full items-center justify-center rounded-full border border-laiton-300/35 bg-laiton-300/[0.06] px-6 py-3.5 text-center text-sm font-semibold text-laiton-200 transition hover:bg-laiton-300/[0.1]"
                    href={buildWhatsAppLink(tier.devisSecondaryCta.whatsappMessage) ?? "/vip"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {tier.devisSecondaryCta.label}
                  </a>
                )}
                <p className="text-center text-[11px] text-graphite-500">
                  {tier.devisFootnote}
                </p>
              </div>
            )}

            <div className="flex-1" />
            {!tier.sessions && (
              <>
                {tier.plan === "PASS_IA" && selectedBilling === "ANNUAL" ? (
                  <>
                    <SubscribeButton
                      plan="PASS_IA"
                      billing="ANNUAL"
                      label="Confirmer l'annuel · 119€/an"
                      className="coai-rainbow-cta w-full border-0 text-[#111216]"
                    />
                    <SubscribeButton
                      plan="PASS_IA"
                      billing="MONTHLY"
                      label="Choisir le mensuel · 19,99€/mois"
                      className="w-full border border-white/15 bg-white/[0.035] text-white"
                    />
                  </>
                ) : (
                  <>
                    <SubscribeButton
                      plan={tier.plan}
                      billing="MONTHLY"
                      label={tier.trial ? `Choisir ${tier.nom} · 7 jours offerts` : `Choisir ${tier.nom}`}
                      className="coai-rainbow-cta w-full border-0 text-[#111216]"
                    />
                    {/* Option annuelle proposée uniquement sur Pass IA. */}
                    {tier.plan === "PASS_IA" && (
                      <>
                        <SubscribeButton
                          plan="PASS_IA"
                          billing="ANNUAL"
                          label="Choisir l'annuel · 119€/an"
                          className="w-full border border-laiton-400/35 bg-laiton-400/10 text-laiton-200"
                        />
                        {/* Marche intermediaire (02/09/2026) : l'ecart entre
                            19,99 €/mois et 9,92 €/mois en annuel laissait
                            partir ceux que l'engagement d'un an rebute. */}
                        <SubscribeButton
                          plan="PASS_IA"
                          billing="QUARTERLY"
                          label={`Choisir 3 mois · ${prixTrimestreCentimes() / 100}€`}
                          className="w-full border border-white/15 bg-white/[0.035] text-white"
                        />
                        {offreTrimestreActive() && (
                          <p className="text-center text-[11px] font-semibold text-laiton-200">
                            Offre de rentrée — 39€ au lieu de 49€ jusqu&apos;au{" "}
                            {FIN_OFFRE_TRIMESTRE_LIBELLE}.
                          </p>
                        )}
                      </>
                    )}
                  </>
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
              <a className="text-center text-sm font-semibold text-laiton-300 underline underline-offset-4" href={vipReservationHref("une transformation physique privée de longue durée", "sur devis") ?? "/vip"} target="_blank" rel="noreferrer">
                Parler d&apos;une transformation physique privée plus longue
              </a>
            )}
          </Card>
        ))}
      </div>

      <div className="w-full max-w-5xl rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] px-5 py-4 text-center">
        <p className="text-sm font-semibold text-white">Ensuite : ton programme est activé, ta première séance t&apos;attend.</p>
        <p className="mt-1 text-xs text-graphite-400">Standard IA : 7 jours d&apos;essai avant le premier prélèvement. Premium Remote et VIP Présentiel se règlent sur devis, via WhatsApp — packs 3 ou 6 mois uniquement, pas de séance isolée en dehors de l&apos;essai.</p>
      </div>


      <p className="max-w-2xl text-center text-xs leading-5 text-graphite-400">
        Standard IA est un abonnement mensuel sans engagement, résiliable à tout moment. Premium Remote et VIP Présentiel (packs de séances engagés 3 ou 6 mois, payés en une fois) se règlent sur devis, conclus directement avec Anthony, sous réserve de disponibilité. Voir les <Link href="/cgv" className="underline">CGV</Link>.
      </p>
    </main>
  );
}
