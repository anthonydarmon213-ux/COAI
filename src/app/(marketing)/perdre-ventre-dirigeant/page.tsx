import type { Metadata } from "next";
import Link from "next/link";
import { BackLink } from "@/components/marketing/back-link";
import { LeadCtaLink } from "@/components/marketing/lead-cta";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { SectionLabel } from "@/components/ui/section-label";

const TITLE = "Perdre du ventre quand on est dirigeant ou CEO | COAI";
const DESCRIPTION =
  "La méthode réaliste pour perdre du ventre malgré les réunions, le stress et les repas d’affaires. Bilan personnalisé COAI offert en moins de 5 minutes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/perdre-ventre-dirigeant" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/perdre-ventre-dirigeant" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const LEVIERS = [
  ["Un entraînement compatible avec ton agenda", "Des séances courtes et progressives, recalculées selon le temps et l’énergie disponibles. La régularité compte davantage qu’une semaine parfaite."],
  ["Une nutrition qui absorbe les repas d’affaires", "COAI organise les repas contrôlables autour des déjeuners, dîners et déplacements, sans régime impossible à maintenir socialement."],
  ["Une récupération réellement pilotée", "Sommeil, fatigue et stress modifient la séance du jour. Le plan évite d’ajouter de la charge quand ton organisme a surtout besoin de récupérer."],
] as const;

const FREINS = [
  ["L’agenda imprévisible", "Une réunion déborde, un déplacement s’ajoute et la séance prévue disparaît. Un plan rigide finit alors par être abandonné."],
  ["Le stress qui ne redescend jamais", "La pression professionnelle perturbe le sommeil, la faim et la récupération. Ajouter toujours plus d’intensité n’est pas la bonne réponse."],
  ["Les repas difficiles à contrôler", "Déjeuners clients, hôtels et dîners tardifs exigent une stratégie flexible, pas une liste d’aliments interdits."],
  ["Le tout ou rien", "Une semaine imparfaite ne doit pas annuler les efforts précédents. COAI cherche la meilleure action possible aujourd’hui."],
] as const;

const ETAPES = [
  ["01", "Mesurer", "Ton bilan analyse ton rythme de vie, ton objectif, ton niveau, ton sommeil et tes contraintes."],
  ["02", "Prioriser", "COAI identifie les changements qui auront le plus d’impact sans bouleverser ton agenda."],
  ["03", "Adapter", "La durée et l’intensité de tes séances évoluent selon ton énergie et ton temps disponibles."],
  ["04", "Progresser", "Tes retours enrichissent ton profil pour rendre l’accompagnement de plus en plus personnel."],
] as const;

const FAQ = [
  {
    question: "Peut-on perdre uniquement la graisse du ventre ?",
    reponse: "On ne choisit pas précisément la zone où le corps puise ses réserves. L’objectif réaliste est de réduire progressivement la masse grasse globale tout en préservant le muscle et la régularité.",
  },
  {
    question: "Combien de séances faut-il avec un agenda chargé ?",
    reponse: "La meilleure fréquence est celle que tu peux tenir. COAI utilise ton niveau, ton objectif et ton temps réel pour proposer des séances adaptées, y compris lors des semaines perturbées.",
  },
  {
    question: "Dois-je supprimer les restaurants et repas professionnels ?",
    reponse: "Non. Ils doivent être intégrés au plan. COAI t’aide à structurer les autres repas et à faire des choix cohérents sans transformer chaque déjeuner professionnel en échec.",
  },
  {
    question: "Comment commencer avec COAI ?",
    reponse: "Le bilan initial est offert et prend moins de cinq minutes. Tu obtiens ton Âge COAI et une orientation personnalisée avant de choisir un accompagnement.",
  },
];

export default function PerdreVentreDirigeantPage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    mainEntityOfPage: "https://coai.fr/perdre-ventre-dirigeant",
    author: { "@type": "Person", name: "Anthony Darmon" },
    publisher: { "@type": "Organization", name: "COAI", url: "https://coai.fr" },
    dateModified: "2026-09-05",
  };

  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center px-6 py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <div className="w-full max-w-5xl pt-8"><BackLink /></div>

      <section className="relative w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-laiton-300/25 bg-[radial-gradient(circle_at_75%_10%,rgba(66,214,222,.14),transparent_30%),rgba(255,255,255,.025)] px-6 py-14 text-center shadow-[0_35px_120px_-65px_rgba(66,214,222,.7)] sm:px-12 sm:py-20">
        <SectionLabel>Méthode COAI Adapt · dirigeants</SectionLabel>
        <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl">
          Perdre du ventre quand on est dirigeant, sans mettre sa vie entre parenthèses.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-graphite-300 sm:text-lg">
          Le problème n&apos;est généralement pas le manque de volonté. C&apos;est un plan qui ignore les réunions tardives,
          les déplacements, les repas professionnels et les nuits trop courtes.
        </p>
        <div className="mt-9">
          <LeadCtaLink placement="seo_perdre_ventre_dirigeant_hero">Découvrir mon Âge COAI →</LeadCtaLink>
          <p className="mt-3 text-xs text-graphite-500">Bilan offert · moins de 5 minutes · sans carte bancaire</p>
        </div>
        <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-white/70">
          {['Agenda chargé', 'Stress', 'Repas d’affaires', 'Déplacements'].map((item) => (
            <span key={item} className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2">{item}</span>
          ))}
        </div>
      </section>

      <section className="w-full max-w-5xl py-20">
        <div className="max-w-3xl">
          <SectionLabel>Pourquoi les méthodes classiques échouent</SectionLabel>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">
            Ton problème n’est pas la motivation. C’est le décalage entre le plan et ta réalité.
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {FREINS.map(([titre, description]) => (
            <article key={titre} className="rounded-3xl border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(66,214,222,.07),rgba(255,255,255,.025))] p-6">
              <h3 className="text-lg font-semibold text-white">{titre}</h3>
              <p className="mt-3 text-sm leading-6 text-graphite-300">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="w-full max-w-5xl pb-20">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Le système, pas la culpabilité</SectionLabel>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">
            Trois leviers coordonnés chaque jour.
          </h2>
          <p className="mt-5 text-base leading-7 text-graphite-300">
            Une transformation durable ne vient pas d&apos;une séance punitive. Elle vient de décisions suffisamment simples pour être répétées, même pendant une semaine difficile.
          </p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {LEVIERS.map(([titre, description], index) => (
            <article key={titre} className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6">
              <span className="font-mono text-xs text-cyan-300">0{index + 1}</span>
              <h2 className="mt-4 text-xl font-semibold text-white">{titre}</h2>
              <p className="mt-3 text-sm leading-6 text-graphite-300">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[radial-gradient(circle_at_10%_0%,rgba(66,214,222,.12),transparent_42%),rgba(0,0,0,.2)] p-7 sm:p-10">
        <div className="max-w-3xl">
          <SectionLabel>La méthode COAI Adapt</SectionLabel>
          <h2 className="mt-5 font-display text-3xl font-semibold text-white sm:text-4xl">Un système qui apprend au lieu de te juger.</h2>
          <p className="mt-4 text-base text-graphite-300">Plus COAI te connaît, meilleur devient ton coaching.</p>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-4">
          {ETAPES.map(([numero, titre, description]) => (
            <li key={numero} className="rounded-3xl border border-white/[0.08] bg-black/20 p-5">
              <span className="font-mono text-xs text-cyan-300">{numero}</span>
              <h3 className="mt-4 text-lg font-semibold text-white">{titre}</h3>
              <p className="mt-2 text-sm leading-6 text-graphite-300">{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-20 grid w-full max-w-5xl gap-6 rounded-[2rem] border border-white/[0.08] bg-black/20 p-7 md:grid-cols-2 sm:p-10">
        <div>
          <SectionLabel>Ce que COAI change</SectionLabel>
          <h2 className="mt-5 font-display text-3xl font-semibold text-white">Ton programme évolue avec ta vraie semaine.</h2>
        </div>
        <div className="space-y-4 text-sm leading-6 text-graphite-300">
          <p>Chaque check-in précise ton sommeil, ton énergie, tes douleurs et ton temps disponible. COAI ajuste ensuite l&apos;action du jour au lieu de te demander de rattraper un planning devenu impossible.</p>
          <p>La méthode est fondée sur 17 ans de terrain d&apos;Anthony Darmon, coach sportif diplômé d&apos;État. En Premium Remote et VIP Présentiel, Anthony ajoute son suivi humain personnel.</p>
          <Link href="/pricing" className="inline-flex font-semibold text-laiton-300 underline underline-offset-4">Comparer les accompagnements →</Link>
        </div>
      </section>

      <SeoFaq items={FAQ} />
      <RelatedSeoLinks currentPath="/perdre-ventre-dirigeant" />

      <section className="pb-8 text-center">
        <h2 className="font-display text-3xl font-semibold text-white">Commence par mesurer ton point de départ.</h2>
        <div className="mt-6"><LeadCtaLink placement="seo_perdre_ventre_dirigeant_bottom">Faire mon bilan gratuit</LeadCtaLink></div>
      </section>
    </main>
  );
}
