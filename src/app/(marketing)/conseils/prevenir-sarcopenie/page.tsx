import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";

const TITLE = "Prévenir la sarcopénie : préserver force et autonomie — COAI";
const DESCRIPTION =
  "Comprendre la sarcopénie et agir pour préserver sa force, son équilibre et son autonomie grâce au renforcement musculaire, à l’activité et à une alimentation adaptée.";
const URL = "https://coai.fr/conseils/prevenir-sarcopenie";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/conseils/prevenir-sarcopenie" },
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

const SIGNAUX = [
  "Se relever d’une chaise devient plus difficile qu’avant.",
  "Porter les courses, monter les escaliers ou ouvrir un bocal demande davantage d’effort.",
  "La marche ralentit ou l’équilibre devient moins sûr.",
  "La fatigue arrive plus vite dans les activités habituelles.",
  "La force diminue alors que le poids ou l’apparence changent peu.",
];

const LEVIERS = [
  {
    numero: "01",
    titre: "Renforcer progressivement",
    texte:
      "Le travail contre résistance est le levier central : pousser, tirer, se relever, porter et stabiliser. La charge doit progresser selon le niveau, la technique et la récupération — pas selon l’ego.",
  },
  {
    numero: "02",
    titre: "Entraîner l’équilibre et la coordination",
    texte:
      "La masse musculaire seule ne suffit pas. Équilibre, vitesse de réaction, coordination et mobilité entretiennent la capacité à utiliser sa force dans la vie réelle.",
  },
  {
    numero: "03",
    titre: "Garder une base d’endurance",
    texte:
      "Marche active, vélo, natation ou travail cardio adapté soutiennent les capacités fonctionnelles. L’OMS recommande aussi de limiter le temps sédentaire : chaque mouvement compte.",
  },
  {
    numero: "04",
    titre: "Manger suffisamment, avec des protéines adaptées",
    texte:
      "L’entraînement a besoin d’énergie et de matériaux pour construire. Les besoins varient avec l’âge, l’activité et la santé : en cas de maladie rénale, de dénutrition ou de pathologie, l’avis d’un médecin ou d’un diététicien est indispensable.",
  },
  {
    numero: "05",
    titre: "Récupérer pour pouvoir recommencer",
    texte:
      "Sommeil, respiration, hydratation et gestion du stress influencent la régularité et la qualité de l’effort. Une séance parfaite isolée vaut moins qu’un plan réaliste tenu pendant des mois.",
  },
] as const;

export default function PrevenirSarcopeniePage() {
  return (
    <main className="coai-landing-lux min-h-screen px-6 pb-24 pt-32 sm:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />

      <article className="mx-auto max-w-4xl">
        <header className="border-b border-white/[0.08] pb-10 text-center">
          <SectionLabel>Force · santé · longévité</SectionLabel>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-[-0.045em] text-white sm:text-6xl">
            Sarcopénie : préserver sa force, c’est préserver son autonomie.
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-graphite-300">
            Pas de gonflette. Le muscle utile permet de porter, marcher, se relever, garder son
            équilibre et continuer à vivre pleinement. Voici comment le protéger dans la durée.
          </p>
          <p className="mt-5 text-xs uppercase tracking-[0.14em] text-graphite-500">
            Par Anthony Darmon · mis à jour le 7 septembre 2026 · 8 min
          </p>
        </header>

        <div className="mt-10 rounded-3xl border border-laiton-300/30 bg-laiton-300/[0.07] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-laiton-200">À retenir</p>
          <p className="mt-3 text-xl font-semibold leading-8 text-white">
            La sarcopénie ne concerne pas seulement le volume musculaire. La baisse de force est un
            signal central, et l’activité physique adaptée — notamment le renforcement — constitue
            le principal levier d’action.
          </p>
        </div>

        <div className="prose-coai mt-12 space-y-12 text-base leading-8 text-graphite-300 sm:text-lg">
          <section>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white">Qu’est-ce que la sarcopénie ?</h2>
            <p className="mt-5">
              Le consensus européen EWGSOP2 décrit la sarcopénie comme une maladie musculaire liée à
              des changements défavorables qui s’accumulent au cours de la vie. Elle est fréquente
              avec l’avancée en âge, mais peut apparaître plus tôt. Une faible force musculaire est
              le premier indicateur ; la quantité ou la qualité musculaire confirme le diagnostic,
              et la baisse des performances physiques en indique la sévérité.
            </p>
            <p className="mt-4">
              Autrement dit : on peut perdre de la capacité avant de voir une transformation
              spectaculaire dans le miroir. C’est pour cela que COAI suit ce que ton corps sait faire,
              pas seulement son apparence.
            </p>
          </section>

          <section>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white">Les signaux qui méritent une attention</h2>
            <ul className="mt-6 grid gap-3">
              {SIGNAUX.map((signal) => (
                <li key={signal} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-4 text-sm leading-6 text-graphite-200 sm:text-base">
                  {signal}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-graphite-400">
              Ces signes ne permettent pas de poser soi-même un diagnostic. Une faiblesse nouvelle,
              des chutes, une perte de poids involontaire ou une baisse rapide des capacités doivent
              être discutées avec un professionnel de santé.
            </p>
          </section>

          <section>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white">Les cinq leviers d’un muscle qui dure</h2>
            <div className="mt-7 grid gap-4">
              {LEVIERS.map((levier) => (
                <div key={levier.numero} className="grid gap-3 rounded-3xl border border-cyan-300/[0.14] bg-cyan-300/[0.035] p-6 sm:grid-cols-[3rem_1fr]">
                  <span className="font-mono text-sm font-bold text-laiton-200">{levier.numero}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{levier.titre}</h3>
                    <p className="mt-2 text-sm leading-7 text-graphite-300 sm:text-base">{levier.texte}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-cyan-300/25 bg-[radial-gradient(circle_at_90%_0%,rgba(56,189,248,.12),transparent_20rem),rgba(255,255,255,.03)] p-7 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">L’approche COAI</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.035em] text-white">Le muscle doit servir ta vie.</h2>
            <p className="mt-5">
              COAI associe force, souplesse, équilibre, coordination, endurance et posture à tes
              leviers quotidiens : alimentation, sommeil, hydratation, respiration et gestion du
              stress. Le résultat recherché est un corps esthétique parce qu’il est entraîné,
              athlétique parce qu’il est capable, et fonctionnel parce qu’il reste utile au quotidien.
            </p>
            <p className="mt-4 font-semibold text-laiton-100">
              Pas de volume à tout prix. Pas de raccourci. Une progression mesurée, adaptée et durable.
            </p>
          </section>

          <section>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white">Un repère simple pour commencer</h2>
            <p className="mt-5">
              Pour les adultes, l’OMS recommande du renforcement des principaux groupes musculaires
              au moins deux jours par semaine. Chez les personnes âgées, elle recommande également
              un travail multicomposant associant équilibre fonctionnel et force, particulièrement
              quand la mobilité diminue. Commence selon tes capacités et augmente progressivement.
            </p>
          </section>

          <section className="border-t border-white/[0.08] pt-10">
            <h2 className="font-display text-2xl font-semibold text-white">Sources et repères</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6">
              <li><a className="text-cyan-200 underline underline-offset-4" href="https://pubmed.ncbi.nlm.nih.gov/30312372/" target="_blank" rel="noreferrer">Consensus européen EWGSOP2 sur la définition et le diagnostic de la sarcopénie</a></li>
              <li><a className="text-cyan-200 underline underline-offset-4" href="https://pubmed.ncbi.nlm.nih.gov/30498820/" target="_blank" rel="noreferrer">Recommandations internationales de pratique clinique sur la sarcopénie</a></li>
              <li><a className="text-cyan-200 underline underline-offset-4" href="https://www.who.int/publications/i/item/9789240014886" target="_blank" rel="noreferrer">Recommandations de l’OMS sur l’activité physique et la sédentarité</a></li>
              <li><a className="text-cyan-200 underline underline-offset-4" href="https://www.has-sante.fr/upload/docs/application/pdf/2019-07/app_248_ref_aps_pa_vf.pdf" target="_blank" rel="noreferrer">Haute Autorité de Santé : activité physique chez les personnes âgées</a></li>
            </ul>
          </section>

          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-laiton-200">À lire ensuite</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link className="text-cyan-200 underline underline-offset-4" href="/conseils/bienfaits-musculation">Les bienfaits de la musculation après 35 ans →</Link>
              <Link className="text-cyan-200 underline underline-offset-4" href="/conseils/pourquoi-prendre-un-coach-sportif">Pourquoi prendre un coach sportif ? →</Link>
            </div>
          </section>
        </div>

        <aside className="mt-12 rounded-[2rem] border border-laiton-300/35 bg-laiton-300/[0.08] p-7 text-center sm:p-10">
          <h2 className="font-display text-3xl font-semibold text-white">Quel est ton point de départ aujourd’hui ?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-graphite-300">
            Le bilan de forme COAI identifie tes priorités et t’oriente vers le niveau d’accompagnement le plus adapté.
          </p>
          <Link href="/diagnostic" className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-laiton-300 px-8 py-4 text-sm font-bold uppercase tracking-[0.04em] text-[#101214] transition hover:bg-laiton-200">
            Faire mon bilan de forme offert →
          </Link>
        </aside>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-graphite-500">
          Cet article fournit des informations générales et ne remplace ni un diagnostic médical ni
          une prise en charge individualisée. En cas de douleur, de pathologie ou de perte rapide de
          capacités, consulte un professionnel de santé.
        </p>
      </article>
    </main>
  );
}
