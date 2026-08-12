import type { Metadata } from "next";
import Link from "next/link";
import { SubscribeButton } from "@/components/compte/subscribe-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { BackLink } from "@/components/marketing/back-link";
import { TrustBadges } from "@/components/marketing/trust-badges";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { PlanSelectedLink } from "@/components/marketing/plan-selected-link";
import { VipCheckoutButton } from "@/components/marketing/vip-checkout-button";

const TITLE = "Tarifs — COAI";
const DESCRIPTION =
  "Choisis le coaching qui te correspond : Impulsion (7 jours offerts), Transformation (programme IA validé par un coach), VIP à la séance avec Anthony Darmon, ou une offre Entreprise sur mesure.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/pricing" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/pricing" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

type Tier = {
  nom: string;
  prix: string;
  suffixe: string;
  // Information d'essai affichée sous le CTA (ex: "7 jours offerts · puis
  // 19€/mois") — Phase 5.1 (11/08/2026, correction responsive) : déplacée
  // du haut de carte (peu visible, à côté du prix) vers directement sous le
  // CTA, là où Anthony voulait qu'elle saute aux yeux.
  essai?: string;
  description: string;
  features: string[];
  plan?: "STANDARD" | "PREMIUM";
  mostPopular?: boolean;
  // Palier VIP : packs payés une fois plutôt qu'un abonnement mensuel.
  sessions?: { label: string; prix: string; pack?: "VISIO" | "PRESENTIEL" }[];
  limitedSpots?: boolean;
};

// Palier Entreprise : sur devis, hors Stripe, structurellement différent
// (contact direct, pas d'abonnement) — sorti du comparateur à 3 colonnes
// (Phase 5.1, correction responsive) plutôt que compressé en 4e colonne,
// affiché en bandeau à part sous les 3 offres principales.
const ENTREPRISE = {
  nom: "Entreprise",
  description: "Coaching pour vos équipes et collaborateurs — accompagnement sur-mesure, sur devis.",
  features: [
    "Programme adapté à vos équipes (mobilité au poste, gestion de l'énergie, prévention)",
    "Formules flexibles — ponctuel, régulier, ou intégré à une démarche QVT",
    "Devis personnalisé selon vos effectifs et vos objectifs",
  ],
  whatsappHref: buildWhatsAppLink(
    "Bonjour Anthony, je vous contacte au sujet d'une offre coaching pour mon entreprise."
  ),
  mailHref: `mailto:anthonydarmon213@hotmail.com?subject=${encodeURIComponent("Offre coaching entreprise")}`,
  siteHref:
    "http://coaching-hybride-anthony.anthonydarmon213.chatgpt.site/?utm_source=pricing&utm_medium=web&utm_content=carte_entreprise",
};

const VIP_MESSAGE =
  "Bonjour Anthony, je suis sur COAI et j'aimerais réserver une séance VIP (présentiel ou visio).";

const TIERS: Tier[] = [
  {
    nom: "Impulsion",
    prix: "19€",
    suffixe: "/mois",
    essai: "7 jours offerts · puis 19€/mois",
    // Correction Anthony (11/08/2026) : un seul parcours, accès immédiat
    // pendant l'essai — plus de choix essai/paiement immédiat qui cassait
    // la dynamique du diagnostic pour un trafic froid (pub TikTok/Instagram).
    description:
      "Ton programme COAI est disponible immédiatement. Profite de COAI gratuitement pendant 7 jours, puis 19€/mois. Résiliable avant la fin de l'essai.",
    features: [
      "Journal de séances",
      "Suivi des mesures et photos de progression",
      "Graphiques de progression",
      "Coach IA — 4 questions/mois",
      "Analyse de bracelet connecté (pas, fréquence cardiaque, sommeil, VO2 max...)",
      "Analyse de photo morphologique et posturale",
      "Programme personnalisé généré par IA — sans relecture humaine",
    ],
  },
  {
    nom: "Transformation",
    prix: "49€",
    suffixe: "/mois",
    essai: "7 jours offerts · puis 49€/mois",
    description:
      "Coaching hybride : IA + coach diplômé d'État, avec un suivi humain tout au long de l'accompagnement, jusqu'à l'atteinte de ton objectif.",
    features: [
      "Suivi de progression avec un coach diplômé d'État, jusqu'à l'atteinte de tes objectifs — pas juste à la génération : ton coach revient vers toi si besoin (plateau, gêne, décrochage) pendant toute la durée de l'accompagnement",
      "Programme personnalisé généré par IA — mobilité, nutrition, récupération, adapté à ton emploi du temps, ta morphologie, tes objectifs (à partir d'un questionnaire initial)",
      "Validation humaine — chaque programme généré est relu et validé par un vrai coach avant de t'arriver (le principe \"AI generates, coaches validate\")",
      "1 séance visio de 30 min/mois avec Anthony Darmon incluse, à réserver via WhatsApp",
      "Suivi de progression — dashboard avec ton évolution",
      "Coach IA — accès illimité, disponible 24h/24 pour ajuster ta routine à tout moment",
      "Ajustements continus — le programme évolue selon tes retours",
      "Assistant WhatsApp 24/7",
      "Analyse de bracelet connecté (pas, fréquence cardiaque, sommeil, VO2 max...)",
      "Analyse de photo morphologique et posturale",
    ],
    plan: "STANDARD" as const,
    mostPopular: true,
  },
  {
    nom: "VIP",
    prix: "Sur réservation",
    suffixe: "",
    description:
      "Coaching 100% humain avec Anthony Darmon — présentiel ou visio, en pack sans abonnement.",
    features: [
      "Coaching 1-to-1 avec Anthony Darmon",
      "Pack de 4 séances, sans abonnement",
      "Accessible à tous, quel que soit ton palier",
    ],
    sessions: [
      { label: "Pack Visio — 4 séances", prix: "360€", pack: "VISIO" },
      { label: "Pack Présentiel — 4 séances", prix: "720€", pack: "PRESENTIEL" },
    ],
    limitedSpots: true,
  },
];

export default function PricingPage({ searchParams }: { searchParams?: { billing?: string; vip?: string; checkout?: string } }) {
  const vipHref = buildWhatsAppLink(VIP_MESSAGE);
  // L'annuel est présenté en premier pour privilégier l'engagement et la
  // trésorerie, sans retirer le mensuel (accessible en un clic).
  const annual = searchParams?.billing !== "monthly";
  const displayedTiers = TIERS.map((tier) => {
    if (!annual || tier.sessions) return tier;
    if (tier.nom === "Impulsion") {
      return { ...tier, prix: "190€", suffixe: "/an", essai: "7 jours offerts · puis 190€/an", description: "Ton programme COAI est disponible immédiatement. Profite de COAI gratuitement pendant 7 jours, puis 190€/an — environ 2 mois offerts." };
    }
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
          Commence simplement avec COAI. Tu pourras faire ton diagnostic personnalisé ensuite.
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

      {/* Comparateur à 3 colonnes propres (Phase 5.1, correction responsive
          11/08/2026) — Entreprise sorti de ce grid (structurellement
          différent : devis, pas d'abonnement) et affiché en bandeau à part
          plus bas, plutôt que compressé en 4e colonne. */}
      <div className="grid w-full max-w-4xl grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                {annual && (
                  <p className="mt-2 text-xs font-medium text-emerald-300">
                    Économie de {tier.nom === "Impulsion" ? "38 €" : "98 €"} par an
                  </p>
                )}
                {!annual && (
                  <Link href="/pricing?billing=annual" className="mt-2 block text-xs font-medium text-laiton-300 hover:text-laiton-200">
                    ou {tier.nom === "Impulsion" ? "190€/an" : "490€/an"} · 2 mois offerts
                  </Link>
                )}
              </div>
            )}

            {/* 4. Description */}
            <p className="text-sm text-graphite-300">{tier.description}</p>

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
                {tier.sessions.map((session) => (
                  <div key={session.label} className="flex flex-col gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-graphite-300">{session.label}</span>
                      <span className="font-semibold text-white">{session.prix}</span>
                    </div>
                    {session.pack && <VipCheckoutButton pack={session.pack} label={`Acheter — ${session.prix}`} variant="secondary" />}
                  </div>
                ))}
                <p className="text-xs leading-5 text-graphite-400">
                  Valable 3 mois. Report gratuit jusqu&apos;à 24 h avant la séance ; passé ce délai, la séance est due.
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
              ) : tier.plan ? (
                <SubscribeButton plan={tier.plan} billing={annual ? "ANNUAL" : "MONTHLY"} label="Commencer gratuitement" className="w-full" />
              ) : (
                <PlanSelectedLink href={`/sign-up?billing=${annual ? "ANNUAL" : "MONTHLY"}`} plan="GRATUIT" billing={annual ? "ANNUAL" : "MONTHLY"} label="Commencer gratuitement" className="w-full" />
              )}
              {tier.essai && <span className="text-sm font-medium text-laiton-300">{tier.essai}</span>}
            </div>
          </Card>
        ))}
      </div>

      {searchParams?.vip === "success" && (
        <Card className="w-full max-w-4xl border-emerald-400/30 bg-emerald-400/[0.06] px-6 py-5 text-center">
          <p className="font-semibold text-white">Paiement confirmé — ton pack VIP est réservé.</p>
          <p className="mt-1 text-sm text-graphite-300">Contacte Anthony sur WhatsApp pour choisir les dates de tes séances.</p>
        </Card>
      )}

      {/* Entreprise : structurellement différent (devis, pas d'abonnement) —
          bandeau à part plutôt que compressé dans le comparateur 3 colonnes. */}
      <Card className="flex w-full max-w-4xl flex-col items-center gap-4 px-6 py-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div className="flex flex-col gap-2 sm:max-w-md">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-white">{ENTREPRISE.nom}</h2>
          <p className="text-sm text-graphite-300">{ENTREPRISE.description}</p>
          <ul className="flex flex-col gap-1.5 text-left text-xs leading-5 text-graphite-400">
            {ENTREPRISE.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-0.5 text-laiton-400">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-2.5">
          {ENTREPRISE.whatsappHref ? (
            <a href={ENTREPRISE.whatsappHref} target="_blank" rel="noopener noreferrer">
              <Button>Demander un devis via WhatsApp</Button>
            </a>
          ) : (
            <a href={ENTREPRISE.mailHref}>
              <Button>Demander un devis par mail</Button>
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

      <p className="max-w-xl text-center text-xs text-graphite-500">
        Les offres Impulsion et Transformation incluent 7 jours offerts, puis sont facturées au choix chaque mois ou chaque année. Elles sont sans
        engagement, résiliables à tout moment depuis ton compte. Les packs VIP sont payés une fois,
        hors abonnement. THE METHOD (accompagnement 1-to-1 complet, 4 séances/mois) reste disponible
        séparément pour qui veut aller plus loin. En t&apos;abonnant, tu acceptes nos{" "}
        <Link href="/cgv" className="underline hover:text-laiton-400">
          CGV
        </Link>
        .
      </p>
    </main>
  );
}
