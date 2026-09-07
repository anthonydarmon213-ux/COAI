import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";

const TITLE = "Pourquoi prendre un coach sportif ? L’exemple des athlètes — COAI";
const DESCRIPTION =
  "Pourquoi se faire accompagner quand on connaît déjà les exercices ? Programmation, feedback, adaptation et régularité : le rôle réel d’un coach sportif.";
const URL = "https://coai.fr/conseils/pourquoi-prendre-un-coach-sportif";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/conseils/pourquoi-prendre-un-coach-sportif" },
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

const ROLES = [
  {
    numero: "01",
    titre: "Transformer un objectif vague en plan précis",
    texte:
      "« Me remettre en forme » ne dit pas quoi entraîner, dans quel ordre ni à quelle dose. Le coach traduit l’objectif en étapes mesurables, choisit les priorités et protège le programme des distractions.",
  },
  {
    numero: "02",
    titre: "Voir ce que l’on ne peut pas voir soi-même",
    texte:
      "Fatigue, technique qui se dégrade, progression trop rapide ou trop timide : quand on est au milieu de l’effort, le jugement est imparfait. Un regard extérieur apporte du recul et évite de confondre sensation, envie et besoin.",
  },
  {
    numero: "03",
    titre: "Donner le bon feedback au bon moment",
    texte:
      "Une consigne claire peut améliorer immédiatement un mouvement. Une revue systématique conclut que le feedback pendant le renforcement peut soutenir la performance, la motivation et certaines adaptations à plus long terme.",
  },
  {
    numero: "04",
    titre: "Adapter le programme à la vraie vie",
    texte:
      "Un déplacement, une mauvaise nuit, une douleur ou une semaine surchargée ne doivent pas détruire la progression. Le rôle du coach est d’ajuster sans abandonner le cap : parfois pousser, parfois réduire, parfois remplacer.",
  },
  {
    numero: "05",
    titre: "Créer de la régularité et de l’engagement",
    texte:
      "Le meilleur programme est celui que l’on réalise assez longtemps pour qu’il produise un effet. Le rendez-vous, le suivi et la mesure rendent l’engagement concret et limitent les décisions quotidiennes inutiles.",
  },
  {
    numero: "06",
    titre: "Décider avec des données, pas avec l’ego",
    texte:
      "Charges, répétitions, sommeil, fatigue et douleurs racontent une histoire. Le coach relie ces informations pour faire évoluer le plan, au lieu de modifier l’entraînement au hasard après chaque bonne ou mauvaise séance.",
  },
] as const;

const MOMENTS_UTILES = [
  "Tu débutes et tu veux apprendre les bons repères sans perdre des mois.",
  "Tu t’entraînes déjà mais tu stagnes, changes souvent de programme ou manques de régularité.",
  "Ton emploi du temps varie et tu as besoin d’un plan qui s’adapte vraiment.",
  "Tu veux préparer un objectif précis sans sacrifier ta santé ni ta récupération.",
  "Tu as besoin d’un engagement humain pour passer de l’intention à l’action.",
];

export default function PourquoiCoachPage() {
  return (
    <main className="coai-landing-lux min-h-screen px-6 pb-24 pt-32 sm:px-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />

      <article className="mx-auto max-w-4xl">
        <header className="border-b border-white/[0.08] pb-10 text-center">
          <SectionLabel>Coaching · progression · performance</SectionLabel>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.06] tracking-[-0.045em] text-white sm:text-6xl">
            Pourquoi prendre un coach quand on sait déjà s’entraîner ?
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-graphite-300">
            Les athlètes de haut niveau ne sont pas accompagnés parce qu’ils ignorent les exercices.
            Ils le sont parce qu’un regard extérieur les aide à mieux décider, mieux ajuster et mieux durer.
          </p>
          <p className="mt-5 text-xs uppercase tracking-[0.14em] text-graphite-500">
            Par Anthony Darmon · mis à jour le 7 septembre 2026 · 9 min
          </p>
        </header>

        <div className="mt-10 rounded-3xl border border-laiton-300/30 bg-laiton-300/[0.07] p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-laiton-200">À retenir</p>
          <p className="mt-3 text-xl font-semibold leading-8 text-white">
            Un coach ne fait pas l’effort à ta place. Il améliore la qualité des décisions qui
            entourent cet effort : quoi faire, quand progresser, quand adapter et comment rester régulier.
          </p>
        </div>

        <div className="mt-12 space-y-12 text-base leading-8 text-graphite-300 sm:text-lg">
          <section>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white">
              Ce que les athlètes ont compris avant tout le monde
            </h2>
            <p className="mt-5">
              Plus le niveau monte, plus l’accompagnement devient précis : préparation physique,
              technique, récupération, nutrition et stratégie. L’athlète reste responsable de son
              effort, mais il ne porte pas seul toutes les décisions.
            </p>
            <p className="mt-4">
              La même logique vaut pour un dirigeant, un parent ou une personne qui reprend le sport.
              Le quotidien n’est pas moins complexe parce que l’objectif n’est pas olympique. Temps
              limité, fatigue, stress et douleurs rendent justement la qualité des choix plus importante.
            </p>
          </section>

          <section>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white">
              Les six vraies fonctions d’un coach
            </h2>
            <div className="mt-7 grid gap-4">
              {ROLES.map((role) => (
                <div
                  key={role.numero}
                  className="grid gap-3 rounded-3xl border border-cyan-300/[0.14] bg-cyan-300/[0.035] p-6 sm:grid-cols-[3rem_1fr]"
                >
                  <span className="font-mono text-sm font-bold text-laiton-200">{role.numero}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{role.titre}</h3>
                    <p className="mt-2 text-sm leading-7 text-graphite-300 sm:text-base">{role.texte}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-cyan-300/25 bg-[radial-gradient(circle_at_90%_0%,rgba(56,189,248,.12),transparent_20rem),rgba(255,255,255,.03)] p-7 sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Humain × intelligence adaptative</p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.035em] text-white">
              Pourquoi COAI augmente le coach au lieu de le remplacer
            </h2>
            <p className="mt-5">
              L’application peut mémoriser les charges, suivre les répétitions, présenter la séance
              et adapter le quotidien. Le coach humain apporte ce qui demande du contexte, du jugement
              et une relation : comprendre un blocage, arbitrer une priorité et accompagner les décisions importantes.
            </p>
            <p className="mt-4 font-semibold text-laiton-100">
              La technologie rend le suivi disponible. L’humain lui donne du sens.
            </p>
          </section>

          <section>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white">
              Quand l’accompagnement devient particulièrement utile
            </h2>
            <ul className="mt-6 grid gap-3">
              {MOMENTS_UTILES.map((moment) => (
                <li
                  key={moment}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-5 py-4 text-sm leading-6 text-graphite-200 sm:text-base"
                >
                  {moment}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white">
              Est-ce forcément mieux d’être supervisé ?
            </h2>
            <p className="mt-5">
              Un programme autonome peut fonctionner. La recherche ne dit pas que chaque personne a
              besoin d’un coach à chaque séance. Elle suggère toutefois que la supervision, la
              programmation et le feedback peuvent apporter des gains supplémentaires selon le public,
              l’objectif et la qualité du dispositif.
            </p>
            <p className="mt-4">
              Dans un essai récent comparant supervision en présentiel, application et programme
              autonome, les trois groupes ont progressé, mais le groupe supervisé a présenté la meilleure
              adhérence et certains gains supérieurs. Chez les adultes plus âgés, les synthèses observent
              également des avantages possibles de la supervision sur la force et plusieurs mesures fonctionnelles,
              tout en appelant à davantage d’études de haute qualité.
            </p>
          </section>

          <section className="border-t border-white/[0.08] pt-10">
            <h2 className="font-display text-2xl font-semibold text-white">Sources et repères</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6">
              <li><a className="text-cyan-200 underline underline-offset-4" href="https://pubmed.ncbi.nlm.nih.gov/40728831/" target="_blank" rel="noreferrer">Essai comparant supervision en présentiel, coaching par application et entraînement autonome</a></li>
              <li><a className="text-cyan-200 underline underline-offset-4" href="https://pubmed.ncbi.nlm.nih.gov/37410360/" target="_blank" rel="noreferrer">Revue systématique sur le feedback pendant l’entraînement en résistance</a></li>
              <li><a className="text-cyan-200 underline underline-offset-4" href="https://pubmed.ncbi.nlm.nih.gov/38647999/" target="_blank" rel="noreferrer">Méta-analyse sur exercice supervisé et non supervisé chez les adultes plus âgés</a></li>
              <li><a className="text-cyan-200 underline underline-offset-4" href="https://pubmed.ncbi.nlm.nih.gov/28573401/" target="_blank" rel="noreferrer">Revue sur supervision, équilibre et force chez les adultes plus âgés</a></li>
            </ul>
          </section>

          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-laiton-200">À lire ensuite</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link className="text-cyan-200 underline underline-offset-4" href="/conseils/bienfaits-musculation">Les bienfaits de la musculation après 35 ans →</Link>
              <Link className="text-cyan-200 underline underline-offset-4" href="/conseils/prevenir-sarcopenie">Comprendre et prévenir la sarcopénie →</Link>
            </div>
          </section>
        </div>

        <aside className="mt-12 rounded-[2rem] border border-laiton-300/35 bg-laiton-300/[0.08] p-7 text-center sm:p-10">
          <h2 className="font-display text-3xl font-semibold text-white">
            De quel niveau d’accompagnement as-tu réellement besoin ?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-graphite-300">
            Le bilan de forme COAI clarifie ton point de départ et t’oriente vers la formule la plus
            cohérente : autonomie guidée, coaching à distance ou accompagnement en présentiel.
          </p>
          <Link
            href="/diagnostic"
            className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-laiton-300 px-8 py-4 text-sm font-bold uppercase tracking-[0.04em] text-[#101214] transition hover:bg-laiton-200"
          >
            Faire mon bilan de forme offert →
          </Link>
        </aside>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-graphite-500">
          Un coach sportif ne remplace pas un médecin ou un professionnel de santé. En cas de douleur,
          de pathologie ou de reprise après une longue interruption, demande un avis adapté à ta situation.
        </p>
      </article>
    </main>
  );
}
