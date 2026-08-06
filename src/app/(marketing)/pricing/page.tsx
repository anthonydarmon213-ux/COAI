import Link from "next/link";
import { SubscribeButton } from "@/components/compte/subscribe-button";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";

type Tier = {
  nom: string;
  prix: string;
  suffixe: string;
  description: string;
  features: string[];
  plan?: "STANDARD" | "PREMIUM";
  mostPopular?: boolean;
};

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
    ],
  },
  {
    nom: "Standard",
    prix: "49€",
    suffixe: "/mois",
    description: "Le programme complet généré par IA, validé par un coach diplômé d'État.",
    features: [
      "Tout le palier Gratuit",
      "Programme entraînement + nutrition + récupération généré par IA",
      "Relu et validé par Anthony Darmon, coach diplômé d'État",
      "Assistant WhatsApp 24/7",
    ],
    plan: "STANDARD" as const,
    mostPopular: true,
  },
  {
    nom: "Premium",
    prix: "199€",
    suffixe: "/mois",
    description: "Une version light de THE METHOD : le programme IA, plus du présentiel avec Anthony.",
    features: [
      "Tout le palier Standard",
      "1 séance par mois en présentiel (Paris) ou en visio",
      "Accès prioritaire pour évoluer vers THE METHOD",
    ],
    plan: "PREMIUM" as const,
  },
];

export default function PricingPage() {
  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="text-center">
        <SectionLabel>Tarifs</SectionLabel>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-graphite-50 sm:text-4xl">
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
            <h2 className="text-lg font-semibold text-graphite-50">{tier.nom}</h2>
            <div className="flex items-baseline gap-1">
              <p className="text-4xl font-semibold text-graphite-50">{tier.prix}</p>
              <span className="text-sm text-graphite-400">{tier.suffixe}</span>
            </div>
            <p className="text-sm text-graphite-300">{tier.description}</p>
            <ul className="flex w-full flex-col gap-2 text-left text-sm text-graphite-300">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-0.5 text-laiton-400">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {tier.plan ? (
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
        Tous les abonnements sont sans engagement, résiliables à tout moment depuis ton compte.
        THE METHOD (accompagnement 1-to-1 complet, 4 séances/mois) reste disponible séparément
        pour qui veut aller plus loin que le palier Premium. En t&apos;abonnant, tu acceptes nos{" "}
        <Link href="/cgv" className="underline hover:text-laiton-400">
          CGV
        </Link>
        .
      </p>
    </main>
  );
}
