import type { Metadata } from "next";
import { SectionLabel } from "@/components/ui/section-label";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";
import { CalculateurCaloriesForm } from "@/components/marketing/calculateur-calories-form";

const TITLE = "Calculateur de calories et macros gratuit — COAI";
const DESCRIPTION =
  "Calcule gratuitement ton métabolisme de base, ta dépense calorique quotidienne (TDEE) et tes macros (protéines, glucides, lipides) selon ton objectif. Résultat instantané, sans inscription.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/calculateur-calories" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/calculateur-calories" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const FAQ_ITEMS = [
  {
    question: "Comment est calculé le résultat ?",
    reponse:
      "Ton métabolisme de base est estimé avec la formule de Mifflin-St Jeor (la référence en nutrition sportive), multiplié par ton niveau d'activité pour obtenir ta dépense calorique quotidienne (TDEE), puis ajusté selon ton objectif (perte de gras, maintien, prise de muscle).",
  },
  {
    question: "Ce calcul est-il fiable pour construire mon programme ?",
    reponse:
      "C'est une bonne estimation de départ, mais générique : elle ne tient pas compte de ta morphologie, de tes contraintes de santé, ni de l'évolution réelle de ta forme au fil des semaines. Un programme COAI part de ce même type de calcul puis l'affine et l'ajuste dans le temps, à partir de ton profil complet et de tes retours réels.",
  },
  {
    question: "Faut-il un compte pour utiliser le calculateur ?",
    reponse: "Non — le calcul est entièrement gratuit, instantané, et ne nécessite aucune inscription.",
  },
  {
    question: "La répartition des macros convient à tout le monde ?",
    reponse:
      "C'est une répartition standard (environ 1,8g de protéines par kg de poids de corps, 25% des calories en lipides, le reste en glucides) — un bon point de départ générique, mais pas une prescription personnalisée à tes objectifs précis ou à une contrainte alimentaire particulière.",
  },
];

export default function CalculateurCaloriesPage() {
  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Calculateur gratuit</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Calcule tes calories et tes macros en 30 secondes.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          Métabolisme de base, dépense calorique quotidienne et répartition protéines/glucides/
          lipides — gratuit, instantané, sans inscription.
        </p>
      </div>

      <CalculateurCaloriesForm />

      <SeoFaq items={FAQ_ITEMS} />

      <RelatedSeoLinks currentPath="/calculateur-calories" />
    </main>
  );
}
