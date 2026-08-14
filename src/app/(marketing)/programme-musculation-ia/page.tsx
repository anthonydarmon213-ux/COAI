import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";

const TITLE = "Programme de musculation généré par IA — COAI";
const DESCRIPTION =
  "Un programme de musculation personnalisé, généré en quelques secondes par intelligence artificielle à partir de ton profil, ton matériel et tes objectifs. Sans engagement, 7 jours offerts.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/programme-musculation-ia" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/programme-musculation-ia" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const ETAPES = [
  {
    numero: "1",
    titre: "Tu renseignes ton profil",
    description: "Niveau, matériel disponible, objectifs, contraintes de santé, rythme de vie.",
  },
  {
    numero: "2",
    titre: "L'IA génère ton programme",
    description:
      "Exercices, séries, répétitions et charges adaptés à toi — en quelques secondes, pas en quelques jours.",
  },
  {
    numero: "3",
    titre: "Tu suis ta progression",
    description: "Journal de séances, mesures et graphiques réunis dans ton espace.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Comment l'IA génère-t-elle mon programme de musculation ?",
    reponse:
      "À partir de ton profil (niveau, objectifs, matériel disponible, contraintes de santé, morphologie), l'IA construit un programme d'entraînement complet : fréquence, exercices, séries, répétitions, charges et méthode d'exécution, avec un échauffement et un retour au calme à chaque séance.",
  },
  {
    question: "Le programme est-il vérifié par un humain ?",
    reponse:
      "Sur le palier Impulsion (19€, paiement unique), ton programme est généré par IA sans relecture. Sur Transformation (49€/mois), chaque programme est en plus relu et validé par un coach diplômé d'État avant de t'être présenté.",
  },
  {
    question: "Le programme s'adapte-t-il à mon matériel (salle, maison, sans matériel) ?",
    reponse:
      "Oui — le matériel que tu renseignes dans ton profil (salle complète, haltères à la maison, poids du corps uniquement...) fait partie des critères pris en compte pour générer les exercices.",
  },
  {
    question: "Je suis débutant, ça fonctionne aussi ?",
    reponse:
      "Oui, le programme s'adapte à ton niveau — les techniques d'intensification (superset, drop-set...) sont réservées aux niveaux intermédiaire et avancé, jamais imposées à un débutant.",
  },
];

export default function ProgrammeMusculationIaPage() {
  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Programme de musculation par IA</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Ton programme de musculation, généré par IA en quelques secondes.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          Fini les programmes génériques trouvés en ligne. COAI construit un programme de
          musculation propre à toi — ton niveau, ton matériel, tes objectifs — puis, si tu veux,
          un coach diplômé d&apos;État le relit avant qu&apos;il t&apos;arrive.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/sign-up">
            <Button>Créer mon programme — 7 jours offerts</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="secondary">Voir les tarifs</Button>
          </Link>
        </div>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-5 py-10 sm:grid-cols-3">
        {ETAPES.map((etape) => (
          <Card key={etape.numero} className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-laiton-400/30 bg-laiton-400/10 text-sm font-semibold text-laiton-300">
              {etape.numero}
            </span>
            <h2 className="text-lg font-semibold text-white">{etape.titre}</h2>
            <p className="text-sm leading-6 text-graphite-300">{etape.description}</p>
          </Card>
        ))}
      </div>

      <div className="max-w-2xl text-center">
        <p className="text-base leading-7 text-graphite-300">
          Chaque séance générée inclut un échauffement en 3 temps, les exercices détaillés
          (séries, répétitions, repos, charge, méthode) et un retour au calme — étirements et
          suggestion de récupération. Le tout mis à jour selon ton profil, jamais un programme
          type copié-collé.
        </p>
      </div>

      <SeoFaq items={FAQ_ITEMS} />

      <RelatedSeoLinks currentPath="/programme-musculation-ia" />

      <section className="flex flex-col items-center gap-5 px-6 pt-6 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
          Prêt à voir ton programme ?
        </h2>
        <Link href="/sign-up">
          <Button>Commencer — 7 jours offerts</Button>
        </Link>
      </section>
    </main>
  );
}
