import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";

const TITLE = "Programme de musculation pour femme, généré par IA — COAI";
const DESCRIPTION =
  "Un programme de musculation pensé pour toi : objectif, niveau et morphologie pris en compte, avec la possibilité d'adapter l'entraînement et la nutrition à ton cycle menstruel, une grossesse ou un post-partum.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/programme-musculation-femme" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/programme-musculation-femme" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const INCLUS = [
  {
    titre: "Pensé pour toi, pas redimensionné",
    description:
      "Ton objectif, ton niveau, ta morphologie et tes contraintes de santé sont pris en compte dès la génération — pas un programme homme réduit en volume.",
  },
  {
    titre: "Adapté à ton cycle, si tu le souhaites",
    description:
      "Phase menstruelle, grossesse ou post-partum : coche l'option et COAI ajuste l'intensité, les précautions et la nutrition en conséquence. Toujours facultatif, jamais présumé.",
  },
  {
    titre: "Une prudence particulière quand ça compte",
    description:
      "Grossesse ou post-partum déclarés : ton programme est systématiquement relu par un coach diplômé d'État avant de t'arriver, quelle que soit ta formule.",
  },
];

const FAQ_ITEMS = [
  {
    question: "Le programme est-il vraiment différent d'un programme pour homme ?",
    reponse:
      "Oui — ton sexe déclaré ajuste les repères caloriques et protéiques indicatifs, et l'ensemble du programme part de ton profil réel (objectif, niveau, morphologie, contraintes), pas d'un modèle unique redimensionné.",
  },
  {
    question: "COAI peut-il adapter mon programme à mon cycle menstruel ?",
    reponse:
      "Oui, en option lors du diagnostic ou depuis ton profil : renseigne la date de tes dernières règles et la durée de ton cycle, et COAI ajuste l'intensité, la stabilité articulaire et les besoins caloriques selon la phase (menstruelle, folliculaire, ovulatoire, lutéale).",
  },
  {
    question: "Et si je suis enceinte ou en post-partum ?",
    reponse:
      "Indique-le et COAI applique une prudence spécifique (pas de décubitus dorsal prolongé au 3e trimestre, pas de manœuvre de Valsalva, reprise progressive et vigilance plancher pelvien en post-partum) — et ton programme est toujours validé par un coach humain avant de t'arriver, jamais livré sans relecture sur ces sujets. Ça ne remplace jamais l'avis de ta sage-femme ou de ton médecin.",
  },
  {
    question: "Est-ce payant dès le départ ?",
    reponse:
      "Non — l'inscription est gratuite, sans carte bancaire. Tu débloques ensuite Impulsion dès 9€ ou Transformation (49€/mois, 7 jours offerts, avec relecture coach) quand tu es prête.",
  },
];

export default function ProgrammeMusculationFemmePage() {
  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Musculation au féminin</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Un programme de musculation pensé pour toi.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          Généré par l&apos;algorithme COAI à partir de ton profil réel — et, si tu le souhaites,
          adapté à ton cycle menstruel, une grossesse ou un post-partum.
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

      <RelatedSeoLinks currentPath="/programme-musculation-femme" />

      <section className="flex flex-col items-center gap-5 px-6 pt-6 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
          Prête à voir ton programme ?
        </h2>
        <Link href="/diagnostic">
          <Button>Faire mon diagnostic offert</Button>
        </Link>
      </section>
    </main>
  );
}
