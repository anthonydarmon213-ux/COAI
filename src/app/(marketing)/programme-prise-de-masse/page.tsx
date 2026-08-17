import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";

const TITLE = "Programme de prise de masse personnalisé par IA — COAI";
const DESCRIPTION =
  "Un programme d'entraînement et un plan nutritionnel générés par IA pour prendre du muscle sans accumuler de gras inutile. Ajusté à ta forme, ton niveau et ton quotidien, semaine après semaine.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/programme-prise-de-masse" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/programme-prise-de-masse" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const INCLUS = [
  {
    titre: "Un surplus calorique maîtrisé, pas au hasard",
    description:
      "Tes apports sont calculés à partir de ton profil réel, avec une variation plafonnée à chaque ajustement — jamais un surplus excessif qui te ferait prendre autant de gras que de muscle.",
  },
  {
    titre: "Une progression de charge structurée",
    description:
      "Ton programme dose le volume et l'intensité selon ton niveau et ton équipement, avec une surcharge progressive réelle — le principal moteur de la prise de muscle.",
  },
  {
    titre: "Un programme qui s'ajuste à ta vraie vie",
    description:
      "Semaine après semaine, l'entraînement et la nutrition se réajustent selon ta récupération, ton énergie et ton emploi du temps — jamais un plan figé que tu abandonnes au premier imprévu.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Comment éviter de prendre trop de gras en prenant du muscle ?",
    reponse:
      "En gardant le surplus calorique modéré et en l'ajustant régulièrement selon ta progression réelle plutôt qu'un chiffre fixe pendant des mois. Chaque ajustement nutritionnel de COAI est plafonné à ±10% par rapport au précédent — jamais de changement brutal dans un sens ou dans l'autre.",
  },
  {
    question: "Le programme inclut-il la nutrition ?",
    reponse:
      "Oui — entraînement, nutrition et récupération font partie du même profil et du même programme, pour un accompagnement cohérent plutôt que des conseils isolés.",
  },
  {
    question: "Combien de temps pour voir des résultats ?",
    reponse:
      "Ça dépend de ton point de départ, ta régularité et ta génétique — aucun chiffre générique ne serait honnête. Ton programme s'ajuste à ta progression réelle plutôt que de promettre un délai fixe.",
  },
  {
    question: "Est-ce payant dès le départ ?",
    reponse:
      "Non — le diagnostic est offert. Tu choisis ensuite Impulsion (49€/mois, 7 jours d'essai) ou Transformation (89€/mois, 7 jours d'essai, avec le regard d'un coach humain).",
  },
];

export default function ProgrammePriseDeMassePage() {
  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Prise de masse</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Prends du muscle, sans prendre n&apos;importe quoi.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          Un programme d&apos;entraînement et un plan nutritionnel construits par l&apos;algorithme
          COAI, puis réajustés à ta progression et ton quotidien au fil du temps.
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

      <RelatedSeoLinks currentPath="/programme-prise-de-masse" />

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
