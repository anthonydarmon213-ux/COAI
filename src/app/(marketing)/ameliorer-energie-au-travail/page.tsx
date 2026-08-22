import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";

const TITLE = "Améliorer son énergie au travail — COAI";
const DESCRIPTION =
  "Sommeil, activité physique et nutrition jouent directement sur ton énergie en journée. COAI construit un programme personnalisé — entraînement, nutrition, récupération — pour retrouver de l'énergie sans bouleverser ton emploi du temps.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/ameliorer-energie-au-travail" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/ameliorer-energie-au-travail" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const AVANTAGES = [
  {
    titre: "La récupération comme levier direct",
    description:
      "Conseils concrets sur le sommeil et la gestion de la fatigue, adaptés à ta situation réelle plutôt qu'à des généralités.",
  },
  {
    titre: "Une activité qui redonne de l'énergie",
    description:
      "Le bon dosage d'entraînement — ni trop, ni trop peu — construit à partir de ton niveau et de ton temps disponible.",
  },
  {
    titre: "Une nutrition qui suit",
    description: "Un plan nutrition personnalisé, pensé pour soutenir ton énergie sur la journée, pas juste ton poids.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Le sport peut vraiment redonner de l'énergie, ou ça fatigue plus ?",
    reponse:
      "Un dosage adapté au niveau et à la récupération réelle de la personne améliore généralement l'énergie perçue en journée — c'est justement le rôle du check-in quotidien : ajuster l'intensité plutôt que d'imposer un volume fixe qui pourrait épuiser.",
  },
  {
    question: "Est-ce que ça remplace un avis médical si je suis constamment fatigué·e ?",
    reponse:
      "Non. Une fatigue persistante mérite un avis médical avant tout. COAI accompagne l'entraînement, la nutrition et la récupération, pas le diagnostic de pathologies.",
  },
  {
    question: "Combien ça coûte ?",
    reponse:
      "Le bilan initial est gratuit. Pass IA coûte ensuite 19,99€/mois (ou 119€/an) avec 7 jours d'essai, Coaching Hybride 99€/mois avec 7 jours d'essai et le regard d'un coach diplômé d'État. Sans engagement.",
  },
];

export default function AmeliorerEnergieAuTravailPage() {
  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Énergie au travail</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Le coup de barre de 15h n&apos;est pas une fatalité.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          Sommeil, activité physique et nutrition sont les trois leviers qui pèsent le plus sur ton
          énergie en journée. COAI construit un programme personnalisé sur les trois, à partir d&apos;un
          bilan gratuit de quelques minutes.
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
          applique le principe « l&apos;IA génère, le coach valide » — un accompagnement construit
          sur des repères de terrain, pas des promesses génériques.
        </p>
      </div>

      <SeoFaq items={FAQ_ITEMS} />

      <RelatedSeoLinks currentPath="/ameliorer-energie-au-travail" />

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
