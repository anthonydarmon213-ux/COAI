import Link from "next/link";
import { SubscribeButton } from "@/components/compte/subscribe-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { BackLink } from "@/components/marketing/back-link";
import { buildWhatsAppLink } from "@/lib/whatsapp";

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
};

const VIP_MESSAGE =
  "Bonjour Anthony, je suis sur COAI et j'aimerais réserver une séance VIP (présentiel ou visio).";

const TIERS: Tier[] = [
  {
    nom: "Gratuit",
    prix: "0€",
    suffixe: "",
    description: "Pour commencer à suivre ta progression, sans engagement.",
    features: [
      "Journal de séances",
      "Suivi des mesures et photos de progression",
      "Graphiques de progression",
      "Coach IA — 4 questions/mois",
    ],
  },
  {
    nom: "Premium",
    prix: "49€",
    suffixe: "/mois",
    description: "Ton programme personnalisé généré par IA, validé par un vrai coach.",
    features: [
      "Programme personnalisé généré par IA — mobilité, nutrition, récupération, adapté à ton emploi du temps, ta morphologie, tes objectifs (à partir d'un questionnaire initial)",
      "Validation humaine — chaque programme généré est relu et validé par un vrai coach avant de t'arriver (le principe \"AI generates, coaches validate\")",
      "Suivi de progression — dashboard avec ton évolution",
      "Chat IA illimité — pour ajuster ta routine à tout moment",
      "Ajustements continus — le programme évolue selon tes retours",
      "Bibliothèque vidéo (yoga, mobilité, récupération…)",
      "Assistant WhatsApp 24/7",
    ],
    plan: "STANDARD" as const,
    mostPopular: true,
  },
  {
    nom: "VIP",
    prix: "Sur réservation",
    suffixe: "",
    description: "Coaching individuel avec Anthony Darmon, à la séance — sans abonnement.",
    features: [
      "Coaching 1-to-1 avec Anthony Darmon",
      "Réservation flexible, sans engagement ni abonnement",
      "Accessible à tous, quel que soit ton palier",
    ],
    sessions: [
      { label: "Présentiel — Paris centre (1h)", prix: "200€" },
      { label: "Visio (1h)", prix: "100€" },
    ],
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
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3">
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
            <h2 className="text-2xl font-semibold tracking-[-0.025em] text-white">{tier.nom}</h2>
            {tier.sessions ? (
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

            {tier.sessions ? (
              vipHref ? (
                <a href={vipHref} target="_blank" rel="noopener noreferrer">
                  <Button>Réserver via WhatsApp</Button>
                </a>
              ) : (
                <p className="text-sm text-graphite-400">Contacte ton coach pour réserver.</p>
              )
            ) : tier.plan ? (
              <SubscribeButton plan={tier.plan} label={`S'abonner — ${tier.prix}${tier.suffixe}`} />
            ) : (
              <Link href="/sign-up">
                <Button>Créer mon compte gratuit</Button>
              </Link>
            )}
          </Card>
        ))}
      </div>

      <p className="max-w-xl text-center text-xs text-graphite-500">
        L&apos;offre Gratuite et l&apos;offre Premium sont sans engagement, résiliables à tout
        moment depuis ton compte. Les séances VIP sont réservées et payées à la séance, hors
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
