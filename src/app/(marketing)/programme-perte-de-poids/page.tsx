import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";

const TITLE = "Programme de perte de poids personnalisé par IA — COAI";
const DESCRIPTION =
  "Un programme d'entraînement et un plan nutritionnel générés par IA pour perdre du gras durablement, sans diète extrême. Ajusté à ta forme et ton quotidien, semaine après semaine.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/programme-perte-de-poids" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/programme-perte-de-poids" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const INCLUS = [
  {
    titre: "Un déficit réaliste, jamais extrême",
    description:
      "Tes objectifs caloriques sont calculés à partir de ton profil réel, avec une variation plafonnée à chaque ajustement — jamais de restriction brutale qui te ferait tout arrêter au bout de 2 semaines.",
  },
  {
    titre: "Un entraînement qui préserve ton muscle",
    description:
      "Perdre du gras sans fondre : ton programme combine renforcement et travail cardiovasculaire dosés selon ton niveau, ton équipement et le temps dont tu disposes.",
  },
  {
    titre: "Un programme qui s'ajuste à ta vraie vie",
    description:
      "Semaine après semaine, l'entraînement et la nutrition se réajustent selon ta forme, ton énergie et ton emploi du temps — jamais un plan figé que tu abandonnes au premier imprévu.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Combien de temps pour voir des résultats ?",
    reponse:
      "Ça dépend de ton point de départ, ta régularité et ton objectif réel — aucun chiffre générique ne serait honnête. Ton programme s'ajuste à ta progression réelle plutôt que de promettre un délai fixe.",
  },
  {
    question: "Le programme inclut-il la nutrition ?",
    reponse:
      "Oui — entraînement, nutrition et récupération font partie du même profil et du même programme, pour un accompagnement cohérent plutôt que des conseils isolés.",
  },
  {
    question: "Le déficit calorique proposé est-il sûr ?",
    reponse:
      "Oui — chaque ajustement nutritionnel est plafonné à ±10% par rapport au précédent, dans les deux sens. Une restriction extrême est tout aussi évitée qu'un surplus extrême : jamais de changement brutal.",
  },
  {
    question: "Est-ce payant dès le départ ?",
    reponse:
      "Non — le diagnostic est offert. Tu choisis ensuite Impulsion (49€/mois, 7 jours d'essai) ou Transformation (89€/mois, 7 jours d'essai, avec le regard d'un coach humain).",
  },
];

export default function ProgrammePerteDePoidsPage() {
  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Perte de poids</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Perds du gras durablement, sans repartir de zéro chaque semaine.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          Un programme d&apos;entraînement et un plan nutritionnel construits par l&apos;algorithme
          COAI, puis réajustés à ta forme et ton quotidien au fil du temps.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/diagnostic">
            <Button>Faire mon diagnostic offert</Button>
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

      <RelatedSeoLinks currentPath="/programme-perte-de-poids" />

      <section className="flex flex-col items-center gap-5 px-6 pt-6 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
          Prêt à voir ton programme ?
        </h2>
        <Link href="/diagnostic">
          <Button>Faire mon diagnostic offert</Button>
        </Link>
      </section>
    </main>
  );
}
