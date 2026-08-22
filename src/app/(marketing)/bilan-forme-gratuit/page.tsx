import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";

const TITLE = "Bilan de forme gratuit — COAI";
const DESCRIPTION =
  "Un bilan de forme gratuit en quelques minutes : objectifs, niveau, contraintes de santé et habitudes. COAI en tire un score, ce qu'il faut travailler en priorité, et un aperçu de ton programme personnalisé — sans carte bancaire.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/bilan-forme-gratuit" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/bilan-forme-gratuit" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const AVANTAGES = [
  {
    titre: "Gratuit, sans carte bancaire",
    description: "Le bilan complet et son résultat sont accessibles sans créer de compte ni renseigner de moyen de paiement.",
  },
  {
    titre: "Un vrai résultat personnalisé",
    description:
      "Un score, tes points à travailler, tes 3 premiers pas concrets et un aperçu de ton programme — pas un simple formulaire suivi d'un mur de paiement.",
  },
  {
    titre: "Quelques minutes suffisent",
    description: "Objectifs, niveau, équipement, contraintes de santé, habitudes — un parcours guidé, une question à la fois.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Le bilan est vraiment gratuit ?",
    reponse:
      "Oui, entièrement — aucune carte bancaire n'est demandée pour faire le bilan ni pour voir ton résultat.",
  },
  {
    question: "Combien de temps ça prend ?",
    reponse:
      "Quelques minutes, une question à la fois. À la fin, tu vois immédiatement ton résultat : score, points à travailler, et un aperçu de ton programme.",
  },
  {
    question: "Je suis obligé·e de m'abonner après le bilan ?",
    reponse:
      "Non. Le résultat du bilan t'appartient. Si tu veux aller plus loin, COAI te recommande la formule la plus adaptée à ton profil, mais rien n'est imposé.",
  },
  {
    question: "Et si je veux un accompagnement ensuite ?",
    reponse:
      "Pass IA coûte 49€/an (soit 4,08€/mois) avec 7 jours d'essai et un coach IA disponible 24h/24. Coaching Hybride coûte 89€/mois avec 7 jours d'essai et ajoute le regard d'un coach diplômé d'État. Les deux sont sans engagement.",
  },
];

export default function BilanFormeGratuitPage() {
  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Bilan de forme gratuit</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Découvre ton point de départ réel, en quelques minutes.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          Objectifs, niveau, contraintes de santé, habitudes — réponds à quelques questions et
          reçois immédiatement un score, tes points à travailler en priorité et un aperçu de ton
          programme. Gratuit, sans carte bancaire.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/diagnostic">
            <Button>Faire mon bilan gratuit</Button>
          </Link>
        </div>
      </div>

      <div className="grid w-full max-w-5xl grid-cols-1 gap-5 py-10 sm:grid-cols-3">
        {AVANTAGES.map((avantage) => (
          <Card key={avantage.titre} className="flex flex-col gap-3 text-center">
            <h2 className="text-lg font-semibold text-white">{avantage.titre}</h2>
            <p className="text-sm leading-6 text-graphite-300">{avantage.description}</p>
          </Card>
        ))}
      </div>

      <div className="max-w-2xl text-center">
        <p className="text-base leading-7 text-graphite-300">
          Fondé sur 17 ans d&apos;expérience de coaching sportif d&apos;Anthony Darmon, le bilan
          COAI s&apos;appuie sur des repères de terrain réels — jamais une donnée inventée pour
          impressionner.
        </p>
      </div>

      <SeoFaq items={FAQ_ITEMS} />

      <RelatedSeoLinks currentPath="/bilan-forme-gratuit" />

      <section className="flex flex-col items-center gap-5 px-6 pt-6 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
          Prêt à découvrir ton bilan ?
        </h2>
        <Link href="/diagnostic">
          <Button>Faire mon bilan gratuit</Button>
        </Link>
      </section>
    </main>
  );
}
