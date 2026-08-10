import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CoaiIntro } from "@/components/marketing/coai-intro";
import { ProgressionSparkline } from "@/components/marketing/progression-sparkline";

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
      "7 jours offerts dès l'inscription (carte bancaire demandée) sur les deux formules — 19€/mois ensuite pour ton programme généré par IA sans relecture, ou 49€/mois pour qu'un coach diplômé d'État le relise et le valide. Sans engagement dans les deux cas.",
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
    titre: "Un coach dans ta poche, H24",
    description:
      "Ton Coach IA répond à toute heure, 7j/7 — ton coach humain supervise la méthode et valide ce qui compte.",
  },
];

export default function LandingPage() {
  return (
    <main className="bg-lab-grid flex flex-col">
      <CoaiIntro />

      <section
        id="hero"
        className="relative mx-auto grid min-h-[92vh] w-full max-w-7xl items-center gap-12 overflow-hidden px-6 pb-20 pt-36 sm:px-10 sm:pt-40 lg:grid-cols-[1.05fr_.95fr] lg:py-28"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        >
          <source src="/hero-intro.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-r from-[#090a0b] via-[#090a0bcc] to-[#090a0b66]"
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-3xl">
          <SectionLabel>Entraînement · Nutrition · Récupération</SectionLabel>
          <h1 className="mt-7 max-w-4xl font-display text-[clamp(2.8rem,5.7vw,5.8rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-white">
            Générer. Valider.
            <span className="mt-2 block text-laiton-300">Suivre ta progression.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-graphite-100 sm:text-xl">
            Tu ne sais pas quoi faire à la salle, tu t&apos;entraînes à la maison sans structure,
            ou tu stagnes avec le même programme depuis des années ? COAI construit ton
            programme sur-mesure — et, selon ta formule, nos coachs diplômés d&apos;État le
            valident et te suivent jusqu&apos;à l&apos;atteinte de tes objectifs.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/sign-up"><Button className="px-7 py-3">Démarrer gratuitement</Button></Link>
            <Link href="/diagnostic"><Button variant="secondary" className="px-7 py-3">Faire mon diagnostic gratuit</Button></Link>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm italic text-graphite-400"><span className="h-1.5 w-1.5 rounded-full bg-laiton-400 shadow-[0_0_10px_#c9a262]" />« L&apos;IA génère. Ton coach valide. »</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-graphite-400"><span className="h-1.5 w-1.5 rounded-full bg-laiton-400 shadow-[0_0_10px_#c9a262]" />Ton Coach IA te répond 24h/24, 7j/7 — jamais seul entre deux séances.</p>
        </div>
        <div className="relative z-10 flex min-h-[30rem] items-center justify-center lg:min-h-[38rem]">
          <div className="absolute bottom-8 left-1/2 w-[min(92%,30rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/70 p-6 shadow-2xl backdrop-blur-xl lg:bottom-2 lg:left-auto lg:right-0 lg:translate-x-0">
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
                ["3", "Ton coach vérifie, valide et démarre le suivi", "Un programme fiable, clair, prêt à suivre — et, selon ta formule, un coach qui te motive jusqu'à l'atteinte de ton objectif."],
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

      {/* Qualification — filtre honnête qui rassure (montre qu'on ne vend
          pas à tout le monde) et évite en amont les abonnés mal alignés qui
          se désabonnent déçus. Demande d'Anthony du 11/08/2026 : éviter de
          dénigrer le PDF, COAI en propose un aussi (export du programme) —
          la vraie différence est "figé" vs "évolue avec toi", pas le format. */}
      <section className="mx-auto w-full max-w-5xl px-6 py-24">
        <div className="text-center">
          <SectionLabel>Pour qui</SectionLabel>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
            Est-ce que COAI est fait pour toi ?
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Card className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-white">C&apos;est pour toi si...</h3>
            <ul className="flex flex-col gap-3 text-left text-sm text-graphite-300">
              {[
                "Tu veux un vrai programme structuré, pas t'entraîner au hasard",
                "Tu veux un suivi qui évolue avec toi, pas un programme figé une fois pour toutes",
                "Tu es prêt à un minimum de régularité — l'IA et le coach font leur part, pas la tienne",
                "Tu veux la rigueur d'un coach pro sans le prix d'un accompagnement 1-to-1 complet",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-laiton-400">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-white">Ce n&apos;est pas pour toi si...</h3>
            <ul className="flex flex-col gap-3 text-left text-sm text-graphite-300">
              {[
                "Tu cherches une solution magique sans rien changer à tes habitudes",
                "Tu veux un coach humain joignable en direct 24h/24 (le Coach IA l'est, pas Anthony)",
                "Tu n'es pas prêt à répondre sincèrement à ton profil — l'IA se base sur ce que tu lui donnes",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-graphite-500">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Crédibilité / Fondateur — juste sous le hero pour rassurer tout de
          suite sur l'humain derrière COAI (visage + nom), avant même le
          reste du pitch. */}
      <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-6 py-24 text-center md:grid-cols-2 md:text-left">
        <div className="relative mx-auto h-72 w-64 overflow-hidden rounded-[2rem] border border-laiton-400/25 shadow-2xl sm:h-96 sm:w-80 md:order-first">
          <Image
            src="/anthony-darmon-portrait.jpg"
            alt="Anthony Darmon, fondateur de COAI"
            fill
            priority
            sizes="(min-width: 640px) 20rem, 16rem"
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
          Le même programme depuis 3 ans. Toujours les mêmes résultats.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-graphite-300 sm:text-lg">
          Débutant perdu à la salle, sédentaire qui reprend le sport, ou entraînement à la maison
          sans structure — dans les trois cas, le problème n&apos;est pas toi. C&apos;est de ne
          pas avoir de vrai programme. COAI construit le tien, corrige ta technique, et
          t&apos;évite de te blesser en t&apos;entraînant au hasard.
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

      {/* Coach IA 24/7 — différenciateur qu'aucun concurrent 100% manuel
          (type TrueCoach) ne peut proposer : une vraie présence permanente,
          pas juste un programme statique. Depuis le 11/08/2026, seul
          Impulsion garde un quota (4 questions/mois) — Transformation est
          illimité (cf. /api/coach/ask), donc "disponible 24/7" est un vrai
          avantage du palier supérieur, pas qu'une promesse marketing. */}
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
        <SectionLabel>Coach IA</SectionLabel>
        <h2 className="max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
          Un coach dans ta poche, disponible H24, 7j/7.
        </h2>
        <p className="max-w-2xl text-base leading-7 text-graphite-300 sm:text-lg">
          Une question à 23h après ta séance ? Un doute sur ta récupération un dimanche matin ?
          Ton Coach IA te répond, jour et nuit — jamais un mail sans réponse jusqu&apos;au lundi.
        </p>
        <div className="mt-2 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {[
            "Disponible 24h/24, 7j/7 — jamais d'attente",
            "Répond en quelques secondes, dans l'esprit de la méthode d'Anthony",
            "Ton coach humain reste dans la boucle pour ce qui compte vraiment",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5 text-sm leading-6 text-graphite-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-laiton-400 shadow-[0_0_10px_#c9a262]" />
              {item}
            </div>
          ))}
        </div>
        <Link href="/sign-up" className="mt-4">
          <Button>Essayer le Coach IA</Button>
        </Link>
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
          7 jours offerts pour découvrir ton espace et ton suivi, puis 19€/mois pour ton programme
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
          7 jours offerts, puis 19€/mois pour ton programme généré par IA — ou 49€/mois avec
          relecture et validation par un coach diplômé d&apos;État. Sans engagement.
        </p>
        <Link href="/sign-up">
          <Button>Commencer</Button>
        </Link>
      </section>
    </main>
  );
}
