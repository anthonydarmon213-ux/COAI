import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";

const TITLE = "Coach sportif en ligne — COAI";
const DESCRIPTION =
  "Un accompagnement sportif à distance : programme généré par IA, validé par un coach diplômé d'État, suivi de ta progression et coach IA disponible à tout moment. Sans engagement.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/coach-sportif-en-ligne" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/coach-sportif-en-ligne" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const AVANTAGES = [
  {
    titre: "Un programme qui t'est propre",
    description:
      "Entraînement, nutrition et récupération construits à partir de ton profil — pas un programme générique envoyé à tout le monde.",
  },
  {
    titre: "Un vrai coach dans la boucle",
    description:
      "Sur le palier Transformation, chaque programme généré par IA est relu et validé par un coach diplômé d'État avant de t'être présenté.",
  },
  {
    titre: "Disponible quand tu en as besoin",
    description:
      "Coach IA pour ajuster ta routine à tout moment, sans attendre le prochain rendez-vous.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Qu'est-ce qu'un coach sportif en ligne, concrètement ?",
    reponse:
      "Un accompagnement à distance : tu renseignes ton profil (objectifs, niveau, contraintes), une IA génère ton programme d'entraînement, nutrition et récupération, et selon le palier choisi, un coach diplômé d'État le relit et le valide avant qu'il t'arrive.",
  },
  {
    question: "Est-ce aussi efficace qu'un coach en présentiel ?",
    reponse:
      "COAI vise un accompagnement structuré et personnalisé à un prix accessible. Pour un suivi 1-to-1 complet avec Anthony Darmon, en présentiel ou en visio, l'offre VIP reste disponible séparément, à la séance.",
  },
  {
    question: "Combien ça coûte ?",
    reponse:
      "Inscription gratuite. 9€ en paiement unique pour un programme construit par les algorithmes COAI sans relecture, ou 49€/mois (7 jours offerts) pour un programme relu et validé par un coach diplômé d'État.",
  },
  {
    question: "Je peux poser des questions à un coach entre deux programmes ?",
    reponse:
      "Oui, le Coach IA est disponible dans ton espace pour ajuster ta routine, répondre à tes questions et t'accompagner au quotidien.",
  },
];

export default function CoachSportifEnLignePage() {
  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Coach sportif en ligne</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Un accompagnement sportif à distance, sérieux et accessible.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          COAI réunit l&apos;intelligence artificielle et l&apos;expertise humaine : ton programme
          est généré par IA à partir de ton profil, et selon le palier choisi, relu et validé par
          un coach diplômé d&apos;État.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/sign-up">
            <Button>Démarrer — 7 jours offerts</Button>
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
          applique le principe « l&apos;IA génère, le coach valide » — pour un accompagnement qui
          garde la rigueur d&apos;un vrai suivi, sans le prix ni la complexité d&apos;un coaching
          individuel classique.
        </p>
      </div>

      <SeoFaq items={FAQ_ITEMS} />

      <RelatedSeoLinks currentPath="/coach-sportif-en-ligne" />

      <section className="flex flex-col items-center gap-5 px-6 pt-6 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
          Prêt à commencer ton accompagnement ?
        </h2>
        <Link href="/sign-up">
          <Button>Commencer — 7 jours offerts</Button>
        </Link>
      </section>
    </main>
  );
}
