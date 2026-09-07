import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";

const TITLE = "Conseils santé, forme et longévité — COAI";
const DESCRIPTION =
  "Les conseils COAI pour développer un corps fort, mobile et durable : force, alimentation, récupération, sommeil, stress et longévité.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/conseils" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/conseils" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const ARTICLES = [
  {
    href: "/conseils/bienfaits-musculation",
    categorie: "Musculation · Santé",
    titre: "Les bienfaits de la musculation après 35 ans",
    description:
      "Force, os, silhouette, autonomie et bien-être : pourquoi le renforcement musculaire est un véritable investissement santé — sans rechercher le volume à tout prix.",
    lecture: "9 min",
  },
  {
    href: "/conseils/pourquoi-prendre-un-coach-sportif",
    categorie: "Coaching · Progression",
    titre: "Pourquoi prendre un coach, même quand on sait déjà s’entraîner ?",
    description:
      "Les athlètes de haut niveau ne manquent pas d’exercices. Ils s’entourent pour mieux décider, ajuster leur charge, recevoir du feedback et rester réguliers. Voici ce que cela change aussi dans la vraie vie.",
    lecture: "9 min",
  },
  {
    href: "/conseils/prevenir-sarcopenie",
    categorie: "Force · Longévité",
    titre: "Sarcopénie : comment préserver sa force et son autonomie ?",
    description:
      "Ce que signifie réellement la perte musculaire liée à l’âge, les signes à surveiller et les actions utiles : renforcement, équilibre, activité et alimentation.",
    lecture: "8 min",
  },
] as const;

export default function ConseilsPage() {
  return (
    <main className="coai-landing-lux min-h-screen px-6 pb-24 pt-32 sm:px-10">
      <header className="mx-auto max-w-4xl text-center">
        <SectionLabel>Conseils COAI</SectionLabel>
        <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-[-0.04em] text-white sm:text-6xl">
          Comprendre ton corps pour mieux le faire durer.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-graphite-300 sm:text-lg">
          Des articles clairs sur la force, la mobilité, l’alimentation, le sommeil, la gestion du
          stress et la longévité — fondés sur les recommandations de santé et l’expérience du terrain.
        </p>
      </header>

      <section className="mx-auto mt-14 grid max-w-5xl gap-6" aria-label="Articles COAI">
        {ARTICLES.map((article) => (
          <article
            key={article.href}
            className="group rounded-[2rem] border border-cyan-300/20 bg-[radial-gradient(circle_at_90%_0%,rgba(56,189,248,.12),transparent_22rem),rgba(255,255,255,.03)] p-7 transition hover:-translate-y-1 hover:border-laiton-300/40 sm:p-10"
          >
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.18em]">
              <span className="text-laiton-200">{article.categorie}</span>
              <span className="text-graphite-500">· {article.lecture} de lecture</span>
            </div>
            <h2 className="mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
              {article.titre}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-graphite-300">{article.description}</p>
            <Link href={article.href} className="mt-7 inline-flex text-sm font-semibold text-cyan-200 transition group-hover:text-laiton-200">
              Lire l’article →
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
