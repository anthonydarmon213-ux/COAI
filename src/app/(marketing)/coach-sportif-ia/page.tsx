import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";

const TITLE = "Coach sportif IA — COAI";
const DESCRIPTION =
  "Un coach sportif propulsé par l'intelligence artificielle : programme d'entraînement, nutrition et récupération généré à partir de ton profil, disponible 24h/24, avec la possibilité d'ajouter le regard d'un coach diplômé d'État.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/coach-sportif-ia" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/coach-sportif-ia" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const AVANTAGES = [
  {
    titre: "Généré à partir de toi",
    description:
      "L'IA construit ton programme à partir de ton profil réel — objectifs, niveau, contraintes — pas d'un modèle générique envoyé à tout le monde.",
  },
  {
    titre: "Disponible en continu",
    description: "Coach IA accessible 24h/24 pour ajuster ta routine, sans attendre un créneau de rendez-vous.",
  },
  {
    titre: "Un humain en renfort si besoin",
    description:
      "Sur le palier Premium Remote, un coach diplômé d'État relit et valide ce que l'IA propose — l'IA génère, l'humain garantit.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Un coach sportif IA, ça remplace vraiment un coach humain ?",
    reponse:
      "L'IA génère un programme personnalisé et s'adapte en continu à tes réponses quotidiennes. Sur le palier Premium Remote, un coach diplômé d'État relit et valide ce que l'IA propose — l'IA n'est jamais seule sur les décisions qui comptent.",
  },
  {
    question: "Comment l'IA personnalise-t-elle mon programme ?",
    reponse:
      "À partir d'un diagnostic complet (objectifs, niveau, équipement, contraintes de santé, habitudes) puis d'un check-in quotidien qui ajuste chaque séance à ton état du jour.",
  },
  {
    question: "Combien ça coûte ?",
    reponse:
      "Standard IA coûte 19,99€/mois (ou 119€/an) avec 7 jours d'essai et un coach IA disponible 24h/24, sans engagement. Premium Remote ajoute le regard d'un coach humain, en pack de 3 mois minimum sur devis.",
  },
];

export default function CoachSportifIaPage() {
  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Coach sportif IA</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Un coach sportif construit par l&apos;intelligence artificielle, jamais laissé seul sur les décisions qui comptent.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          COAI génère ton programme d&apos;entraînement, de nutrition et de récupération à partir
          de ton profil réel — et, selon le palier choisi, un coach diplômé d&apos;État le relit
          avant qu&apos;il ne devienne définitif.
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
          applique le principe « l&apos;IA génère, le coach valide » — pour garder la rigueur d&apos;un
          vrai suivi, sans le prix ni la complexité d&apos;un coaching individuel classique.
        </p>
      </div>

      <SeoFaq items={FAQ_ITEMS} />

      <RelatedSeoLinks currentPath="/coach-sportif-ia" />

      <section className="flex flex-col items-center gap-5 px-6 pt-6 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
          Prêt à voir ce que l&apos;IA peut faire pour toi ?
        </h2>
        <Link href="/diagnostic">
          <Button>Faire mon bilan gratuit</Button>
        </Link>
      </section>
    </main>
  );
}
