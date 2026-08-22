import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";

const TITLE = "Coach santé IA pour dirigeants — COAI";
const DESCRIPTION =
  "Un accompagnement sport, nutrition et récupération pensé pour un emploi du temps de dirigeant : programme généré par IA à partir de ton profil, adapté chaque jour, validé par un coach diplômé d'État.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/coach-sante-dirigeant" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/coach-sante-dirigeant" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const AVANTAGES = [
  {
    titre: "Adapté à un agenda qui bouge",
    description:
      "Le check-in quotidien ajuste chaque séance à ton temps disponible réel — 15 minutes un jour chargé, davantage un autre.",
  },
  {
    titre: "Zéro temps perdu en aller-retour",
    description: "Coach IA disponible 24h/24 pour ajuster ta routine, sans attendre un créneau de rendez-vous.",
  },
  {
    titre: "Un regard humain quand ça compte",
    description:
      "Sur le palier Coaching Hybride, un coach diplômé d'État relit et valide ton programme avant qu'il ne devienne définitif.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Je n'ai pas un emploi du temps régulier, ça peut marcher pour moi ?",
    reponse:
      "Oui — le check-in quotidien (sommeil, forme, temps disponible) adapte chaque séance à ta vraie journée, pas à un planning théorique fixé à l'avance.",
  },
  {
    question: "Combien de temps ça prend au quotidien ?",
    reponse:
      "Le check-in prend moins d'une minute. La séance elle-même s'ajuste au temps que tu déclares avoir ce jour-là (15 à 60 minutes).",
  },
  {
    question: "Et pour mes équipes ?",
    reponse:
      "COAI propose aussi un accompagnement dédié aux collaborateurs, sur devis — voir la page Entreprise pour le détail.",
  },
  {
    question: "Combien ça coûte ?",
    reponse:
      "Pass IA coûte 19,99€/mois (ou 119€/an) avec 7 jours d'essai et un coach IA disponible 24h/24. Coaching Hybride coûte 99€/mois avec 7 jours d'essai et ajoute le regard d'un coach humain. Les deux sont sans engagement.",
  },
];

export default function CoachSanteDirigeantPage() {
  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Coach santé IA pour dirigeants</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Ta forme physique n&apos;a pas à attendre que ton agenda se libère.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          COAI construit un programme d&apos;entraînement, de nutrition et de récupération qui
          s&apos;adapte chaque jour à ton temps réel — pas à un planning figé que la première
          réunion imprévue vient casser.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/diagnostic">
            <Button>Faire mon bilan gratuit</Button>
          </Link>
          <Link href="/entreprise">
            <Button variant="secondary">Pour mes équipes</Button>
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
          applique le principe « l&apos;IA génère, le coach valide » — pour un accompagnement
          rigoureux qui se plie à ton emploi du temps, pas l&apos;inverse.
        </p>
      </div>

      <SeoFaq items={FAQ_ITEMS} />

      <RelatedSeoLinks currentPath="/coach-sante-dirigeant" />

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
