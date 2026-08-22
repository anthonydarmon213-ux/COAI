import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";
import { MembreFondateurBadge } from "@/components/marketing/membre-fondateur-badge";
import { PROGRAMMES_PRETS } from "@/lib/programmes-prets/catalogue";

const TITLE = "Challenge 30 jours gratuit — COAI";
const DESCRIPTION =
  "30 jours, 30 petites actions, un vrai changement d'habitude. Le Challenge 30 jours COAI est entièrement gratuit — mouvement, nutrition, récupération et mental, un défi par jour.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/challenge-30-jours" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/challenge-30-jours" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const CHALLENGE = PROGRAMMES_PRETS.find((p) => p.slug === "challenge-30-jours")!;

const FAQ_ITEMS = [
  {
    question: "Le challenge est vraiment gratuit ?",
    reponse:
      "Oui, entièrement — les 30 jours sont visibles sur cette page, sans compte ni carte bancaire. Aucune inscription n'est nécessaire pour le suivre.",
  },
  {
    question: "C'est adapté à mon niveau ?",
    reponse:
      "Oui — chaque défi est volontairement court et accessible à tous les niveaux. L'objectif n'est pas la performance, c'est la régularité sur 30 jours.",
  },
  {
    question: "Et après les 30 jours ?",
    reponse:
      "Fais ton bilan de forme gratuit sur COAI pour un programme réellement personnalisé — entraînement, nutrition, récupération — construit à partir de ton profil, pas d'une liste générique.",
  },
];

export default function Challenge30JoursPage() {
  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="max-w-2xl text-center">
        <SectionLabel>Challenge gratuit · 30 jours</SectionLabel>
        <h1 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          30 jours, 30 petites actions, un vrai changement d&apos;habitude.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          Pas un programme d&apos;entraînement classique : un défi quotidien qui mêle mouvement,
          nutrition, récupération et mental. Quelques minutes par jour, entièrement gratuit, sans
          compte ni carte bancaire.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/diagnostic">
            <Button>Faire mon bilan gratuit</Button>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-md">
        <MembreFondateurBadge />
      </div>

      <div className="w-full max-w-3xl rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 text-left sm:p-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-laiton-300">
          Ta récompense à la fin des 30 jours
        </p>
        <p className="mt-2 text-base leading-7 text-graphite-200">
          Termine le challenge, puis fais ton bilan de forme COAI gratuit pour repartir avec un
          score personnalisé et un programme construit sur mesure — et si tu veux aller plus loin,
          rejoins les 100 premiers membres fondateurs COAI (tarif Pass IA bloqué à vie).
        </p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CHALLENGE.jours.map((jour) => (
          <div key={jour.jour} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-left">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-laiton-400">
              {jour.jour} — {jour.focus}
            </span>
            <p className="mt-1.5 text-sm leading-6 text-graphite-300">{jour.contenu}</p>
          </div>
        ))}
      </div>

      <SeoFaq items={FAQ_ITEMS} />

      <RelatedSeoLinks currentPath="/challenge-30-jours" />

      <section className="flex flex-col items-center gap-5 px-6 pt-6 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
          Prêt·e à commencer ?
        </h2>
        <Link href="/diagnostic">
          <Button>Faire mon bilan gratuit</Button>
        </Link>
      </section>
    </main>
  );
}
