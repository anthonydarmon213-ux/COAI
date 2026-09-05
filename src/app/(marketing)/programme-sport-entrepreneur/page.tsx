import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";

const TITLE = "Programme sportif personnalisé pour entrepreneur — COAI";
const DESCRIPTION =
  "Un programme d'entraînement, de nutrition et de récupération généré par IA à partir de ton profil et de ton temps réel disponible — pensé pour tenir malgré un rythme d'entrepreneur irrégulier.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/programme-sport-entrepreneur" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/programme-sport-entrepreneur" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const AVANTAGES = [
  {
    titre: "Un programme qui tient dans la durée",
    description:
      "Construit à partir de ton profil réel (objectifs, niveau, équipement, contraintes) — pas un programme générique qu'on abandonne après deux semaines.",
  },
  {
    titre: "Jamais bloquant",
    description:
      "Séance raccourcie un jour chargé, jour de repos absorbé sans culpabilité — le programme s'ajuste à toi, pas l'inverse.",
  },
  {
    titre: "Suivi sans effort mental",
    description: "Un check-in quotidien de moins d'une minute suffit pour que le programme reste pertinent.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Je voyage beaucoup et mon rythme change tout le temps, ça peut marcher ?",
    reponse:
      "Oui — le mode voyage et l'ajustement quotidien absorbent les changements de rythme sans casser la progression construite jusque-là.",
  },
  {
    question: "Il me faut combien de temps par séance ?",
    reponse:
      "Ton programme est calibré sur la durée de séance que tu déclares (15 à 60 minutes), et le check-in quotidien peut la réduire encore si le jour l'exige.",
  },
  {
    question: "Combien ça coûte ?",
    reponse:
      "Standard IA coûte 19,99€/mois (ou 119€/an) avec 7 jours d'essai et un coach IA disponible 24h/24, sans engagement. Premium Remote ajoute le regard d'un coach humain diplômé d'État, en pack de 3 mois minimum sur devis.",
  },
];

export default function ProgrammeSportEntrepreneurPage() {
  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Programme sportif pour entrepreneur</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Un programme conçu pour survivre à une semaine imprévisible.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          COAI génère ton entraînement, ta nutrition et ta récupération à partir de ton profil, puis
          ajuste chaque séance à ton temps réel disponible — pour que le programme reste tenable,
          même une semaine chargée.
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
        {AVANTAGES.map((avantage) => (
          <Card key={avantage.titre} className="flex flex-col gap-3 text-center">
            <h2 className="text-lg font-semibold text-white">{avantage.titre}</h2>
            <p className="text-sm leading-6 text-graphite-300">{avantage.description}</p>
          </Card>
        ))}
      </div>

      <div className="max-w-2xl text-center">
        <p className="text-base leading-7 text-graphite-300">
          Fondé sur 17 ans d&apos;expérience de coaching sportif d&apos;Anthony Darmon, COAI
          applique le principe « l&apos;IA génère, le coach valide » — un accompagnement rigoureux,
          sans le prix ni la complexité d&apos;un coaching individuel classique.
        </p>
      </div>

      <SeoFaq items={FAQ_ITEMS} />

      <RelatedSeoLinks currentPath="/programme-sport-entrepreneur" />

      <section className="flex flex-col items-center gap-5 px-6 pt-6 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
          Prêt à faire ton bilan ?
        </h2>
        <Link href="/diagnostic">
          <Button>Faire mon bilan gratuit</Button>
        </Link>
      </section>
    </main>
  );
}
