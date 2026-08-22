import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";

const TITLE = "Programme de musculation pour débutant, généré par IA — COAI";
const DESCRIPTION =
  "Un premier programme de musculation pensé pour un vrai débutant : mouvements simples, progression prudente, sans jargon. Adapté à ton équipement et ton temps disponible, dès ta première séance.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/programme-musculation-debutant" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/programme-musculation-debutant" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const INCLUS = [
  {
    titre: "Pas besoin de déjà savoir",
    description:
      "Ton programme part de zéro connaissance technique : mouvements accessibles, consignes claires, sans jargon de salle de sport à décoder tout seul.",
  },
  {
    titre: "Une progression qui respecte ton corps",
    description:
      "Le volume et l'intensité démarrent bas et augmentent progressivement selon ta récupération réelle — jamais un programme copié sur un pratiquant confirmé.",
  },
  {
    titre: "Adapté à ce que tu as vraiment",
    description:
      "Salle, maison, aucun matériel : ton programme est construit à partir de ton équipement réel et du temps dont tu disposes, pas d'un cas idéal.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Je n'ai jamais fait de musculation, ce programme est fait pour moi ?",
    reponse:
      "Oui — c'est exactement le profil visé. Ton diagnostic capture ton niveau réel (y compris zéro expérience) et le programme généré démarre là où tu en es vraiment, jamais sur une base supposée.",
  },
  {
    question: "Faut-il aller en salle de sport ?",
    reponse:
      "Non — indique ton équipement réel au diagnostic (salle complète, quelques accessoires à la maison, ou aucun matériel) et le programme s'adapte en conséquence, sans jamais présumer un accès à une salle.",
  },
  {
    question: "Combien de temps avant de voir une vraie progression ?",
    reponse:
      "Chez un débutant, les premiers gains de force apparaissent souvent vite (adaptation neuromusculaire), mais le rythme dépend de ta régularité et de ton point de départ — ton programme s'ajuste à ta progression réelle plutôt que de promettre un délai fixe.",
  },
  {
    question: "Est-ce payant dès le départ ?",
    reponse:
      "Non — le diagnostic est offert. Tu choisis ensuite Pass IA (19,99€/mois ou 119€/an, 7 jours d'essai) ou Coaching Hybride (99€/mois, 7 jours d'essai, avec le regard d'un coach humain).",
  },
];

export default function ProgrammeMusculationDebutantPage() {
  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Musculation débutant</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Ton premier programme, sans te perdre.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          Généré par l&apos;algorithme COAI à partir de ton vrai niveau — mouvements accessibles,
          progression prudente, adapté à ton équipement et ton temps disponible.
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

      <RelatedSeoLinks currentPath="/programme-musculation-debutant" />

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
