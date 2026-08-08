import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CoaiIntro } from "@/components/marketing/coai-intro";

export const metadata: Metadata = {
  title: "COAI — Coaching sportif par IA, validé par un vrai coach",
  description:
    "Ton programme d'entraînement, nutrition et récupération généré par IA à partir de ton profil, relu et validé par Anthony Darmon (17 ans de coaching). AI generates, humans validate.",
  alternates: { canonical: "/" },
};

const FAQ = [
  {
    question: "Est-ce que c'est juste un robot, ou un vrai coach ?",
    reponse:
      "Les deux : l'IA génère ton programme à partir de ton profil. En Transformation, chaque programme est en plus relu et validé par un coach diplômé d'État avant de t'arriver — tu ne reçois jamais de contenu IA brut à ce palier.",
  },
  {
    question: "C'est adapté si je suis débutant ?",
    reponse:
      "Oui — ton niveau, ton équipement et tes contraintes de santé font partie du profil pris en compte pour générer et valider ton programme.",
  },
  {
    question: "C'est payant dès le départ ?",
    reponse:
      "1 mois offert dès l'inscription (carte bancaire demandée), puis 19€/mois pour ton programme généré par IA, sans relecture humaine. Passe à 49€/mois quand tu veux que chaque programme soit relu et validé par un coach diplômé d'État. Sans engagement dans les deux cas.",
  },
  {
    question: "Quelle est la différence avec THE METHOD (coaching 1-to-1) ?",
    reponse:
      "À 19€/mois, ton programme est généré par IA sans relecture ; à 49€/mois, un coach diplômé d'État le relit et le valide. THE METHOD est un accompagnement 1-to-1 complet avec Anthony. Tu peux commencer avec l'un de ces deux formats, puis passer à THE METHOD quand tu veux aller plus loin.",
  },
  {
    question: "Je peux résilier quand je veux ?",
    reponse: "Oui, l'abonnement est sans engagement — tu résilies à tout moment depuis ton compte.",
  },
];

const PILIERS = [
  {
    numero: "01",
    titre: "Un programme vraiment personnel",
    description:
      "Entraînement, nutrition et récupération (sauna, massage, mobilité, méditation, sommeil...) construits autour de ton niveau, de tes objectifs et de tes contraintes.",
  },
  {
    numero: "02",
    titre: "Une progression visible",
    description:
      "Tes séances, tes mesures et tes progrès réunis dans un suivi simple qui évolue avec toi.",
    visuel: true,
  },
  {
    numero: "03",
    titre: "Une présence au quotidien",
    description:
      "L’IA t’accompagne à tout moment. Anthony supervise la méthode et valide ce qui compte.",
  },
];

// Courbe de progression décorative — illustre le pilier "suivi", pas une
// donnée réelle : une seule série, pas de légende ni d'axes nécessaires.
function ProgressionSparkline() {
  return (
    <svg
      viewBox="0 0 200 64"
      className="h-16 w-full max-w-[13rem]"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="progression-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a262" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#c9a262" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M4 48 C 30 52, 45 38, 62 40 S 96 22, 116 24 S 150 6, 196 8"
        stroke="#c9a262"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 48 C 30 52, 45 38, 62 40 S 96 22, 116 24 S 150 6, 196 8 V 64 H 4 Z"
        fill="url(#progression-fill)"
      />
      <circle cx="196" cy="8" r="3.5" fill="#c9a262" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <main className="bg-lab-grid flex flex-col">
      <CoaiIntro />

      <section id="hero" className="mx-auto grid min-h-[92vh] w-full max-w-7xl items-center gap-12 px-6 pb-20 pt-36 sm:px-10 sm:pt-40 lg:grid-cols-[1.05fr_.95fr] lg:py-28">
        <div className="relative z-10 max-w-3xl">
          <SectionLabel>Entraînement · Nutrition · Récupération</SectionLabel>
          <h1 className="mt-7 max-w-4xl font-display text-[clamp(2.8rem,5.7vw,5.8rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-white">
            Générer. Valider.
            <span className="mt-2 block text-laiton-300">Suivre ta progression.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-graphite-100 sm:text-xl">
            L&apos;IA analyse toutes tes données pour un entraînement augmenté, personnalisé pour
            toi — avec un vrai coach qui valide.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/sign-up"><Button className="px-7 py-3">Démarrer gratuitement</Button></Link>
            <a href="#piliers"><Button variant="secondary" className="px-7 py-3">Découvrir la méthode</Button></a>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm italic text-graphite-400"><span className="h-1.5 w-1.5 rounded-full bg-laiton-400 shadow-[0_0_10px_#c9a262]" />« L&apos;IA génère. Ton coach valide. »</p>
        </div>
        <div className="relative flex min-h-[30rem] items-center justify-center lg:min-h-[38rem]">
          <div className="coai-orb" aria-hidden="true" />
          <div className="absolute bottom-8 left-1/2 w-[min(92%,30rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/70 p-6 shadow-2xl backdrop-blur-xl lg:bottom-10 lg:left-0 lg:translate-x-0">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-laiton-400">Comment ça marche ?</p>
                <p className="mt-1.5 text-base font-semibold text-white">Simplement, en trois étapes.</p>
              </div>
              <span className="rounded-full bg-laiton-400/10 px-2.5 py-1 text-xs font-medium text-laiton-300">COAI</span>
            </div>
            <ol className="mt-5 flex flex-col gap-4">
              {[
                ["1", "Tu renseignes ton profil", "Objectifs, niveau, contraintes et rythme de vie."],
                ["2", "L’IA personnalise ton programme", "Entraînement, nutrition et récupération adaptés à toi."],
                ["3", "Ton coach vérifie et valide", "Tu reçois un programme fiable, clair et prêt à suivre."],
              ].map(([numero, titre, description]) => (
                <li key={numero} className="grid grid-cols-[2rem_1fr] gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-laiton-400/30 bg-laiton-400/10 text-sm font-semibold text-laiton-300">{numero}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{titre}</p>
                    <p className="mt-1 text-sm leading-5 text-graphite-400">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* L'histoire */}
      <section className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-28">
        <SectionLabel>L&apos;histoire</SectionLabel>
        <h2 className="mt-6 font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Pourquoi COAI existe.
        </h2>
        <div className="mt-8 font-editorial text-lg leading-8 text-graphite-200 sm:text-xl sm:leading-9">
          <p>
            Anthony Darmon a passé dix-sept ans sur le terrain — en salle, en visio, à corriger
            un mouvement, ajuster un macro, entendre ce qu&apos;un chiffre sur la balance ne dit
            jamais. De cette expérience est né THE METHOD : un accompagnement 1-to-1 exigeant,
            réservé à ceux qui peuvent y consacrer 490 à 800€ par mois.
          </p>
          <p className="mt-7 border-l-2 border-laiton-400 pl-6 italic text-white">
            Mais l&apos;expertise ne devrait pas être un luxe. Et un algorithme seul ne devrait
            jamais avoir le dernier mot sur un corps.
          </p>
          <p className="mt-7">
            COAI est né de cette tension. Un programme aussi précis qu&apos;une consultation
            privée, généré en quelques secondes par l&apos;IA — mais jamais livré sans qu&apos;Anthony,
            ou un coach qu&apos;il a formé, ne l&apos;ait relu, corrigé, validé.
          </p>
        </div>
      </section>

      {/* Positionnement */}
      <section className="mx-auto w-full max-w-5xl border-y border-white/[0.07] px-6 py-20 text-center sm:py-24">
        <SectionLabel>Le constat</SectionLabel>
        <h2 className="mx-auto mt-6 max-w-4xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Un accompagnement sérieux, sans la complexité ni le prix du coaching individuel.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-graphite-300 sm:text-lg">
          Un programme clair, un suivi structuré et des réponses quand tu en as besoin.
        </p>
      </section>

      {/* Les 3 piliers */}
      <section id="piliers" className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-24">
        <div className="text-center">
          <SectionLabel>Ce que tu obtiens</SectionLabel>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">Tout ce qui compte pour progresser, enfin réuni.</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PILIERS.map((pilier) => (
            <Card
              key={pilier.titre}
              className="flex min-h-72 flex-col items-center justify-start gap-6 px-7 py-8 text-center"
            >
              <span className="text-sm font-semibold text-laiton-400">{pilier.numero}</span>
              <div className="flex flex-col items-center">
                <h3 className="text-2xl font-semibold leading-tight tracking-[-0.025em] text-white">{pilier.titre}</h3>
                <p className="mt-4 max-w-xs text-base leading-7 text-graphite-300">{pilier.description}</p>
              </div>
              {pilier.visuel && <ProgressionSparkline />}
            </Card>
          ))}
        </div>
        <div className="mx-auto max-w-3xl border-t border-white/[0.08] pt-10 text-center">
          <p className="font-display text-2xl font-semibold leading-tight tracking-[-0.025em] text-white sm:text-3xl">
            Ton entraînement, ta nutrition et ta récupération,
            <span className="text-laiton-300"> personnalisés par l&apos;IA et validés par un coach diplômé d&apos;État.</span>
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-graphite-300 sm:text-lg">
            Parce que deux coachs valent mieux qu&apos;un, COAI réunit l&apos;intelligence artificielle
            et l&apos;expertise humaine avec une seule mission : te proposer le meilleur accompagnement.
          </p>
        </div>
      </section>

      {/* Crédibilité / Fondateur */}
      <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-6 py-24 text-center md:grid-cols-2 md:text-left">
        <div className="relative mx-auto h-72 w-64 overflow-hidden rounded-[2rem] border border-laiton-400/25 shadow-2xl sm:h-96 sm:w-80 md:order-first">
          <Image
            src="/anthony-darmon-portrait.jpg"
            alt="Anthony Darmon, fondateur de COAI"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col items-center gap-5 md:items-start">
          <SectionLabel>Fondateur</SectionLabel>
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
            Anthony Darmon.
          </h2>
          <p className="font-editorial text-xl italic text-laiton-300">
            « Le mouvement est la clé de tout. »
          </p>
          <p className="max-w-md text-base leading-7 text-graphite-300">
            Coach diplômé d&apos;État, expert en coaching sportif depuis plus de 17 ans,
            spécialiste des dirigeants et entrepreneurs. De cette expérience est né THE METHOD,
            puis COAI — pour rendre cette expertise accessible à tous, sans attendre le
            coaching 1-to-1.
          </p>
          <a
            href="https://coaching-hybride-anthony.anthonydarmon213.chatgpt.site/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-laiton-400 underline hover:text-laiton-300"
          >
            Découvrir THE METHOD (coaching 1-to-1 en présentiel ou à distance) →
          </a>
        </div>
      </section>

      {/* Accès aux offres */}
      <section
        id="offres"
        className="mx-auto my-16 flex w-[calc(100%-3rem)] max-w-3xl flex-col items-center gap-6 rounded-[2rem] border border-laiton-400/20 bg-white/[0.035] px-6 py-12 text-center shadow-[0_40px_120px_-60px_rgba(201,162,98,0.35)] backdrop-blur sm:px-12 sm:py-16"
      >
        <SectionLabel>Choisis ton accompagnement</SectionLabel>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">
          Commence à ton rythme.
        </h2>
        <p className="max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          1 mois offert pour découvrir ton espace et ton suivi, puis 19€/mois pour ton programme
          généré par IA. Passe à 49€/mois quand tu veux qu&apos;un coach diplômé d&apos;État le
          relise et le valide. Sans engagement.
        </p>
        <Link href="/pricing">
          <Button>Découvrir les offres</Button>
        </Link>
      </section>

      {/* FAQ */}
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-24">
        <div className="text-center">
          <SectionLabel>Questions fréquentes</SectionLabel>
        </div>
        <div className="flex flex-col gap-3">
          {FAQ.map((item) => (
            <Card key={item.question}>
              <details>
                <summary className="cursor-pointer list-none text-sm font-medium text-graphite-50 marker:content-none">
                  <span className="text-base font-semibold">{item.question}</span>
                </summary>
                <p className="mt-3 text-sm text-graphite-300">{item.reponse}</p>
              </details>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="flex flex-col items-center gap-5 border-t border-white/[0.07] px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">Prêt à commencer ?</h2>
        <p className="text-graphite-300">
          1 mois offert, puis 19€/mois pour ton programme généré par IA — ou 49€/mois avec
          relecture et validation par Anthony. Sans engagement.
        </p>
        <Link href="/sign-up">
          <Button>Commencer</Button>
        </Link>
      </section>
    </main>
  );
}
