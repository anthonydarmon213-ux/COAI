import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";

const TITLE = "Les bienfaits de la musculation après 35 ans — COAI";
const DESCRIPTION =
  "Force, santé osseuse, silhouette, autonomie et bien-être : les bénéfices du renforcement musculaire et les principes pour progresser durablement.";
const URL = "https://coai.fr/conseils/bienfaits-musculation";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/conseils/bienfaits-musculation" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "article", url: URL },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: TITLE,
  description: DESCRIPTION,
  datePublished: "2026-09-07",
  dateModified: "2026-09-07",
  author: { "@type": "Person", name: "Anthony Darmon" },
  publisher: { "@type": "Organization", name: "COAI", url: "https://coai.fr" },
  mainEntityOfPage: URL,
};

const BENEFICES = [
  {
    numero: "01",
    titre: "Construire une force vraiment utile",
    texte:
      "Se relever, porter, pousser, tirer, monter des escaliers : la force rend les gestes du quotidien plus faciles. L’objectif n’est pas seulement de déplacer une charge, mais de développer une capacité qui sert ta vie.",
  },
  {
    numero: "02",
    titre: "Préserver le muscle avec l’âge",
    texte:
      "Le renforcement aide à développer ou maintenir la force et la masse maigre. Après 35 ans, cette réserve devient un véritable capital pour rester actif, autonome et résistant au fil des décennies.",
  },
  {
    numero: "03",
    titre: "Solliciter les os et soutenir les articulations",
    texte:
      "Un entraînement progressif impose au squelette et aux tissus une contrainte adaptée. Les études chez les adultes plus âgés montrent des gains nets de force et, selon les protocoles et les sites mesurés, un effet favorable ou préventif sur la densité osseuse.",
  },
  {
    numero: "04",
    titre: "Transformer la silhouette sans sacrifier la fonction",
    texte:
      "Associée à une alimentation cohérente, la musculation peut favoriser une silhouette plus tonique et athlétique. Chez COAI, l’esthétique est la conséquence visible d’un corps entraîné — jamais l’unique boussole.",
  },
  {
    numero: "05",
    titre: "Améliorer posture, stabilité et confiance",
    texte:
      "Renforcer le tronc, les hanches, le dos et les jambes donne davantage de contrôle au mouvement. La posture ne se résume pas à se tenir droit : elle dépend aussi de la mobilité, de la coordination et de la capacité à changer de position sans appréhension.",
  },
  {
    numero: "06",
    titre: "Soutenir le bien-être mental",
    texte:
      "Progresser, maîtriser un geste et constater que son corps devient capable nourrit le sentiment d’efficacité. Les synthèses de recherche observent aussi des effets favorables de l’exercice, dont le renforcement, sur les symptômes dépressifs et anxieux.",
  },
  {
    numero: "07",
    titre: "Investir dans sa santé à long terme",
    texte:
      "Les études observationnelles associent la pratique du renforcement à un risque de mortalité plus faible. Cela ne prouve pas qu’une séance est une assurance-vie, mais confirme que la force a toute sa place aux côtés de l’endurance, du sommeil et de l’alimentation.",
  },
] as const;

const PRINCIPES = [
  "Entraîner les principaux groupes musculaires, pas seulement les muscles visibles.",
  "Commencer avec une technique maîtrisée et une difficulté adaptée.",
  "Faire progresser graduellement les charges, les répétitions ou la qualité d’exécution.",
  "Conserver mobilité, équilibre, coordination et endurance dans le programme.",
  "Ajuster l’effort à son sommeil, son stress, ses douleurs et sa récupération.",
];

export default function BienfaitsMusculationPage() {
  return (
    <main className="coai-landing-lux min-h-screen px-6 pb-24 pt-32 sm:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />

      <article className="mx-auto max-w-4xl">
        <header className="border-b border-white/[0.08] pb-10 text-center">
          <SectionLabel>Musculation · santé · longévité</SectionLabel>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-[-0.045em] text-white sm:text-6xl">
            Les bienfaits de la musculation vont bien au-delà du miroir.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-graphite-300">
            Plus de force, une silhouette athlétique, davantage d’autonomie et un corps mieux préparé
            pour durer. Pas de gonflette : du muscle utile, construit intelligemment.
          </p>
          <p className="mt-5 text-xs uppercase tracking-[0.14em] text-graphite-500">
            Par Anthony Darmon · mis à jour le 7 septembre 2026 · 9 min
          </p>
        </header>

        <div className="mt-10 rounded-3xl border border-laiton-300/30 bg-laiton-300/[0.07] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-laiton-200">À retenir</p>
          <p className="mt-3 text-xl font-semibold leading-8 text-white">
            La musculation n’est pas réservée aux bodybuilders. Bien programmée, elle développe la
            force, entretient les capacités physiques et aide à construire un corps esthétique parce
            qu’il est plus capable, plus stable et plus fonctionnel.
          </p>
        </div>

        <div className="mt-12 space-y-12 text-base leading-8 text-graphite-300 sm:text-lg">
          <section>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white">
              Musculation ou gonflette : ce n’est pas le même projet
            </h2>
            <p className="mt-5">
              La musculation est une méthode : utiliser une résistance pour rendre le corps plus fort.
              Le bodybuilding est une discipline particulière, orientée vers le développement visuel
              maximal de la masse musculaire. On peut donc pratiquer la musculation sans chercher à
              devenir massif — et avec des objectifs de santé, de posture, de performance ou de bien-être.
            </p>
            <p className="mt-4">
              Chez COAI, la charge est un outil. Nous cherchons le transfert vers la vie réelle : mieux
              bouger, moins subir son quotidien et garder un corps disponible pour ses projets.
            </p>
          </section>

          <section>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white">
              Sept bénéfices qui comptent vraiment
            </h2>
            <div className="mt-7 grid gap-4">
              {BENEFICES.map((benefice) => (
                <div
                  key={benefice.numero}
                  className="grid gap-3 rounded-3xl border border-cyan-300/[0.14] bg-cyan-300/[0.035] p-6 sm:grid-cols-[3rem_1fr]"
                >
                  <span className="font-mono text-sm font-bold text-laiton-200">{benefice.numero}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{benefice.titre}</h3>
                    <p className="mt-2 text-sm leading-7 text-graphite-300 sm:text-base">{benefice.texte}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-cyan-300/25 bg-[radial-gradient(circle_at_90%_0%,rgba(56,189,248,.12),transparent_20rem),rgba(255,255,255,.03)] p-7 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">La méthode COAI</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.035em] text-white">
              La force au centre. Le corps entier autour.
            </h2>
            <p className="mt-5">
              Un bon programme ne juxtapose pas des exercices au hasard. Il relie force, souplesse,
              équilibre, coordination, endurance et posture, puis ajuste l’entraînement à la respiration,
              l’hydratation, l’alimentation, au sommeil et à la gestion du stress.
            </p>
            <p className="mt-4 font-semibold text-laiton-100">
              Le résultat : un physique esthétique, athlétique et fonctionnel, au service de ta santé,
              de ton bien-être et de ta longévité.
            </p>
          </section>

          <section>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white">
              Comment commencer sans se compliquer la vie
            </h2>
            <p className="mt-5">
              L’OMS recommande aux adultes de renforcer les principaux groupes musculaires au moins
              deux jours par semaine. La bonne dose dépend ensuite de ton expérience, de tes capacités,
              de ton emploi du temps et de ta récupération.
            </p>
            <ul className="mt-6 grid gap-3">
              {PRINCIPES.map((principe) => (
                <li
                  key={principe}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-4 text-sm leading-6 text-graphite-200 sm:text-base"
                >
                  {principe}
                </li>
              ))}
            </ul>
          </section>

          <section className="border-t border-white/[0.08] pt-10">
            <h2 className="font-display text-2xl font-semibold text-white">Sources et repères</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6">
              <li><a className="text-cyan-200 underline underline-offset-4" href="https://www.who.int/publications/i/item/9789240014886" target="_blank" rel="noreferrer">Recommandations de l’OMS sur l’activité physique et le renforcement musculaire</a></li>
              <li><a className="text-cyan-200 underline underline-offset-4" href="https://pubmed.ncbi.nlm.nih.gov/39405023/" target="_blank" rel="noreferrer">Revue de 151 essais sur force, masse maigre et fonction physique</a></li>
              <li><a className="text-cyan-200 underline underline-offset-4" href="https://pubmed.ncbi.nlm.nih.gov/35608815/" target="_blank" rel="noreferrer">Revue sur entraînement progressif, force et densité osseuse</a></li>
              <li><a className="text-cyan-200 underline underline-offset-4" href="https://pubmed.ncbi.nlm.nih.gov/35599175/" target="_blank" rel="noreferrer">Méta-analyse sur renforcement musculaire et risque de mortalité</a></li>
              <li><a className="text-cyan-200 underline underline-offset-4" href="https://pubmed.ncbi.nlm.nih.gov/40432290/" target="_blank" rel="noreferrer">Revue sur exercice, symptômes dépressifs et anxieux</a></li>
            </ul>
          </section>

          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-laiton-200">À lire ensuite</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link className="text-cyan-200 underline underline-offset-4" href="/conseils/prevenir-sarcopenie">Comprendre et prévenir la sarcopénie →</Link>
              <Link className="text-cyan-200 underline underline-offset-4" href="/conseils/pourquoi-prendre-un-coach-sportif">Pourquoi prendre un coach sportif ? →</Link>
            </div>
          </section>
        </div>

        <aside className="mt-12 rounded-[2rem] border border-laiton-300/35 bg-laiton-300/[0.08] p-7 text-center sm:p-10">
          <h2 className="font-display text-3xl font-semibold text-white">
            Quels bénéfices ton corps doit-il rechercher en priorité ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-graphite-300">
            Le bilan de forme COAI analyse ton point de départ et t’oriente vers l’accompagnement le
            plus adapté à ton objectif, ton niveau et ton quotidien.
          </p>
          <Link
            href="/diagnostic"
            className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-laiton-300 px-8 py-4 text-sm font-bold uppercase tracking-[0.04em] text-[#101214] transition hover:bg-laiton-200"
          >
            Faire mon bilan de forme offert →
          </Link>
        </aside>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-graphite-500">
          Cet article fournit des informations générales et ne remplace ni un avis médical ni une
          prise en charge individualisée. En cas de douleur, de pathologie ou de reprise après une
          longue interruption, demande conseil à un professionnel de santé.
        </p>
      </article>
    </main>
  );
}
