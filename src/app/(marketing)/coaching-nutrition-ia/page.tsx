import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";

const TITLE = "Coaching nutrition par IA — COAI";
const DESCRIPTION =
  "Un plan nutritionnel personnalisé, généré par intelligence artificielle à partir de ton profil, tes objectifs et tes habitudes alimentaires. Objectifs journaliers, conseils, sans engagement.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/coaching-nutrition-ia" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/coaching-nutrition-ia" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const INCLUS = [
  {
    titre: "Un plan qui tient compte de toi",
    description:
      "Habitudes alimentaires, allergies, nombre de repas, hydratation, consommation de café et d'alcool — tout est pris en compte.",
  },
  {
    titre: "Des objectifs journaliers clairs",
    description:
      "Protéines, apports et repères concrets pour chaque journée, pas juste une liste d'aliments interdits.",
  },
  {
    titre: "Des conseils d'habitudes durables",
    description: "Des ajustements réalistes, pensés pour tenir dans le temps, pas une diète stricte à court terme.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Le plan nutritionnel est-il un régime strict ?",
    reponse:
      "Non — COAI génère des objectifs journaliers (protéines, apports, repères concrets) et des conseils d'habitudes adaptés à ton mode de vie, pas une liste d'interdits. L'idée est que ça reste tenable dans la durée.",
  },
  {
    question: "Mes allergies et intolérances sont prises en compte ?",
    reponse:
      "Oui, tu renseignes tes allergies alimentaires et tes habitudes actuelles dans ton profil, et elles sont prises en compte lors de la génération de ton plan.",
  },
  {
    question: "Le plan nutrition est-il relu par un professionnel ?",
    reponse:
      "Avec Standard IA (19,99€/mois ou 119€/an), ton plan évolue grâce au Personal Trainer IA disponible 24h/24. Premium Remote ajoute le regard et les ajustements d'un coach humain, dans le cadre d'un accompagnement sur devis (engagement minimum 3 mois).",
  },
  {
    question: "Est-ce lié à mon programme d'entraînement ?",
    reponse:
      "Oui — nutrition, entraînement et récupération font partie du même profil et du même suivi, pour un accompagnement cohérent plutôt que des conseils isolés.",
  },
];

export default function CoachingNutritionIaPage() {
  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Coaching nutrition par IA</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Un plan nutritionnel pensé pour toi, généré par IA.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          Pas de régime générique : COAI construit tes objectifs nutritionnels à partir de ton
          profil, tes habitudes et tes objectifs — avec la possibilité qu&apos;un coach diplômé
          d&apos;État le valide.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/diagnostic">
            <Button>Faire mon bilan gratuit</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="secondary">Voir les tarifs</Button>
          </Link>
        </div>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-5 py-10 sm:grid-cols-3">
        {INCLUS.map((item) => (
          <Card key={item.titre} className="flex flex-col gap-3 text-center">
            <h2 className="text-lg font-semibold text-white">{item.titre}</h2>
            <p className="text-sm leading-6 text-graphite-300">{item.description}</p>
          </Card>
        ))}
      </div>

      <SeoFaq items={FAQ_ITEMS} />

      <RelatedSeoLinks currentPath="/coaching-nutrition-ia" />

      <section className="flex flex-col items-center gap-5 px-6 pt-6 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
          Prêt à voir ton plan nutritionnel ?
        </h2>
        <Link href="/diagnostic">
          <Button>Faire mon bilan gratuit</Button>
        </Link>
      </section>
    </main>
  );
}
