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

const TITLE = "Tarifs — COAI";
const DESCRIPTION =
  "Choisis ton niveau d'accompagnement : Impulsion (7 jours offerts), Transformation (programme IA validé par un coach), VIP à la séance avec Anthony Darmon, ou une offre Entreprise sur mesure.";

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
  description: string;
  features: string[];
  plan?: "STANDARD" | "PREMIUM";
  mostPopular?: boolean;
  // Palier VIP : tarifs à la séance plutôt qu'un abonnement mensuel — pas
  // de bouton d'abonnement Stripe, juste une réservation via WhatsApp.
  sessions?: { label: string; prix: string }[];
  limitedSpots?: boolean;
  // Palier Entreprise : sur devis, hors Stripe — contact direct (WhatsApp/
  // mail) et renvoi vers le site dédié (coaching-hybride-anthony).
  external?: { whatsappHref: string | null; mailHref: string; siteHref: string };
};

const VIP_MESSAGE =
  "Bonjour Anthony, je suis sur COAI et j'aimerais réserver une séance VIP (présentiel ou visio).";

const ENTREPRISE_MESSAGE =
  "Bonjour Anthony, je vous contacte au sujet d'une offre coaching pour mon entreprise.";
const ENTREPRISE_SITE_HREF =
  "http://coaching-hybride-anthony.anthonydarmon213.chatgpt.site/?utm_source=pricing&utm_medium=web&utm_content=carte_entreprise";

const TIERS: Tier[] = [
  {
    nom: "Impulsion",
    prix: "0€",
    suffixe: "les 7 premiers jours",
    description:
      "Coaching 100% IA — entraînée avec les 17 ans d'expertise terrain d'Anthony Darmon, sans relecture humaine. 7 jours offerts, puis 19€/mois. Sans engagement — résiliable à tout moment.",
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
    description:
      "7 jours offerts, puis 49€/mois. Coaching hybride : IA + coach diplômé d'État, avec un suivi humain tout au long de l'accompagnement, jusqu'à l'atteinte de ton objectif.",
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
      "Coaching 100% humain avec Anthony Darmon, à la séance — présentiel ou visio, sans abonnement.",
    features: [
      "Coaching 1-to-1 avec Anthony Darmon",
      "Réservation flexible, sans engagement ni abonnement",
      "Accessible à tous, quel que soit ton palier",
    ],
    sessions: [
      { label: "Présentiel — Paris centre (1h)", prix: "200€" },
      { label: "Visio (1h)", prix: "100€" },
      { label: "Présentiel — 1 mois, 1 séance/semaine", prix: "800€" },
      { label: "Visio — 1 mois, 1 séance/semaine", prix: "400€" },
    ],
    limitedSpots: true,
  },
  {
    nom: "Entreprise",
    prix: "Sur devis",
    suffixe: "",
    description: "Coaching pour vos équipes et collaborateurs — accompagnement sur-mesure.",
    features: [
      "Programme adapté à vos équipes (mobilité au poste, gestion de l'énergie, prévention)",
      "Formules flexibles — ponctuel, régulier, ou intégré à une démarche QVT",
      "Devis personnalisé selon vos effectifs et vos objectifs",
    ],
    external: {
      whatsappHref: buildWhatsAppLink(ENTREPRISE_MESSAGE),
      mailHref: `mailto:anthonydarmon213@hotmail.com?subject=${encodeURIComponent("Offre coaching entreprise")}`,
      siteHref: ENTREPRISE_SITE_HREF,
    },
  },
];

export default function PricingPage() {
  const vipHref = buildWhatsAppLink(VIP_MESSAGE);

  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-5xl pt-8">
        <BackLink />
      </div>
      <div className="text-center">
        <SectionLabel>Tarifs</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Choisis ton niveau d&apos;accompagnement
        </h1>
        <div className="mt-6 flex justify-center">
          <TrustBadges />
        </div>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => (
          <Card
            key={tier.nom}
            className={`flex flex-col items-center gap-5 px-6 py-8 text-center ${
              tier.mostPopular ? "border-laiton-400/40" : ""
            }`}
          >
            {tier.mostPopular && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-laiton-400">
                Le plus choisi
              </span>
            )}
            {tier.limitedSpots && <Badge tone="warning">Places limitées</Badge>}
            <h2 className="text-2xl font-semibold tracking-[-0.025em] text-white">{tier.nom}</h2>
            {tier.sessions || tier.external ? (
              <p className="text-lg font-semibold text-white">{tier.prix}</p>
            ) : (
              <div className="flex items-baseline gap-1">
                <p className="text-5xl font-semibold tracking-[-0.045em] text-white">{tier.prix}</p>
                <span className="text-sm text-graphite-400">{tier.suffixe}</span>
              </div>
            )}
            <p className="text-sm text-graphite-300">{tier.description}</p>
            <ul className="flex w-full flex-col gap-2 text-left text-sm text-graphite-300">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-laiton-400">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {tier.sessions && (
              <ul className="flex w-full flex-col gap-2 rounded-lg border border-graphite-800 bg-graphite-900/40 p-3 text-left text-sm">
                {tier.sessions.map((session) => (
                  <li key={session.label} className="flex items-center justify-between gap-3">
                    <span className="text-graphite-300">{session.label}</span>
                    <span className="font-semibold text-white">{session.prix}</span>
                  </li>
                ))}
              </ul>
            )}

            {tier.external ? (
              <div className="flex flex-col items-center gap-2.5">
                {tier.external.whatsappHref ? (
                  <a href={tier.external.whatsappHref} target="_blank" rel="noopener noreferrer">
                    <Button>Demander un devis via WhatsApp</Button>
                  </a>
                ) : (
                  <a href={tier.external.mailHref}>
                    <Button>Demander un devis par mail</Button>
                  </a>
                )}
                <a
                  href={tier.external.siteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-laiton-400 underline hover:text-laiton-300"
                >
                  En savoir plus →
                </a>
              </div>
            ) : tier.sessions ? (
              vipHref ? (
                <a href={vipHref} target="_blank" rel="noopener noreferrer">
                  <Button>Réserver via WhatsApp</Button>
                </a>
              ) : (
                <Button disabled>Contacte ton coach pour réserver</Button>
              )
            ) : tier.plan ? (
              <SubscribeButton
                plan={tier.plan}
                label={tier.plan === "STANDARD" ? "S'abonner — 7 jours offerts" : `S'abonner — ${tier.prix}${tier.suffixe}`}
              />
            ) : (
              <Link href="/sign-up">
                <Button>Créer mon compte — 7 jours offerts</Button>
              </Link>
            )}
          </Card>
        ))}
      </div>

      <p className="max-w-xl text-center text-xs text-graphite-500">
        L&apos;offre Impulsion (7 jours offerts, carte bancaire requise à l&apos;inscription, puis
        19€/mois) et l&apos;offre Transformation (7 jours offerts, puis 49€/mois) sont sans
        engagement, résiliables à tout moment depuis ton compte. Les séances VIP sont réservées et
        payées à la séance, hors
        abonnement. THE METHOD (accompagnement 1-to-1 complet, 4 séances/mois) reste disponible
        séparément pour qui veut aller plus loin. En t&apos;abonnant, tu acceptes nos{" "}
        <Link href="/cgv" className="underline hover:text-laiton-400">
          CGV
        </Link>
        .
      </p>
    </main>
  );
}
