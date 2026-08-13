import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CoaiIntro } from "@/components/marketing/coai-intro";
import { ProgressionSparkline } from "@/components/marketing/progression-sparkline";
import { AppPreviewPhones } from "@/components/marketing/app-preview-phones";
import { AdaptatifIcon, SuiviIcon, ValidationIcon, SecuriteIcon } from "@/components/marketing/feature-icons";
import { InstagramIcon, LinkedinIcon } from "@/components/ui/social-icons";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { VideoShowcase } from "@/components/marketing/video-showcase";

const TITLE = "COAI — Ton programme évolue avec toi";
const DESCRIPTION =
  "Ton entraînement, ta nutrition et ta récupération personnalisés par IA et adaptés à ton quotidien. En Transformation, un coach diplômé valide ton programme.";

// 11/08/2026 : sans ce bloc openGraph/twitter dédié, chaque page publique
// affichait le titre/description génériques du layout racine ("COAI — HI ×
// AI™") quand on la partageait sur WhatsApp/Facebook/LinkedIn — Next.js ne
// déduit pas automatiquement openGraph/twitter à partir de title/description.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
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
  {
    question: "Et si mon programme ne me convient pas ?",
    reponse:
      "Il évolue avec tes retours (charge, disponibilité, gêne...) — en Transformation, ton coach ajuste directement ; en Impulsion, tu régénères depuis ton profil mis à jour. Et si ça ne te convient toujours pas, tu résilies à tout moment depuis ton compte, sans justification.",
  },
  {
    question: "Mes données sont-elles en sécurité ?",
    reponse:
      "Oui — hébergement en UE (RGPD), paiement géré directement par Stripe (COAI ne voit jamais ta carte bancaire), et tu peux exporter ou supprimer tes données à tout moment depuis ton compte.",
  },
];

const FONCTIONNALITES_HERO = [
  { icon: AdaptatifIcon, titre: "Programme adaptatif", description: "Des ajustements basés sur tes données réelles." },
  { icon: SuiviIcon, titre: "Suivi intelligent", description: "COAI analyse tes performances, ta récupération et ton quotidien." },
  { icon: ValidationIcon, titre: "Validation humaine", description: "Un coach vérifie et optimise là où l'IA a ses limites." },
  { icon: SecuriteIcon, titre: "Sécurisé & privé", description: "Tes données sont protégées, jamais revendues." },
];

const COMMENT_CA_MARCHE = [
  ["1", "Tu renseignes ton profil", "Objectifs, niveau, contraintes et rythme de vie."],
  ["2", "L'IA personnalise ton programme", "Entraînement, nutrition et récupération adaptés à toi."],
  ["3", "Ton coach vérifie, valide et démarre le suivi", "Un programme fiable, clair, prêt à suivre — et, selon ta formule, un coach qui te motive jusqu'à l'atteinte de ton objectif."],
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
      <TrackConversion name="landing_viewed" />
      <CoaiIntro />

      <section aria-labelledby="video-presentation-title" className="mx-auto w-full max-w-5xl px-6 pb-16 sm:px-10">
        <div className="mb-6 text-center">
          <SectionLabel>Découvrir COAI</SectionLabel>
          <h2 id="video-presentation-title" className="mt-4 font-display text-2xl font-semibold text-white sm:text-4xl">
            Ton coaching, en images.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-graphite-400">
            Découvre comment COAI relie intelligence artificielle, suivi quotidien et validation humaine.
          </p>
        </div>
        <VideoShowcase />
        <div className="mt-5 flex flex-col items-center justify-center gap-3 text-center sm:flex-row">
          <Link href="/pricing"><Button>Essayer gratuitement pendant 7 jours</Button></Link>
          <Link href="/diagnostic" className="text-sm text-laiton-300 underline hover:text-laiton-200">Faire mon diagnostic offert →</Link>
        </div>
      </section>

      {/* Aperçu produit — anciennement dupliquait le kicker/titre/sous-titre
          de CoaiIntro juste au-dessus (11/08/2026, fusion demandée par
          Anthony pour éviter la répétition). Ne garde que les mockups,
          sans re-décrire ce que CoaiIntro vient déjà de dire. */}
      <section id="apercu-produit" className="relative mx-auto flex w-full max-w-5xl justify-center px-6 pb-16 pt-8 sm:px-10">
        <AppPreviewPhones />
      </section>

      {/* Ligne de fonctionnalités sous le hero — reprend exactement les
          garde-fous déjà mis en avant ailleurs sur la page (adaptatif,
          suivi, validation humaine, sécurité), condensés en un coup d'œil. */}
      <section className="mx-auto w-full max-w-6xl border-t border-white/[0.06] px-6 py-12 sm:px-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FONCTIONNALITES_HERO.map((item) => (
            <div key={item.titre} className="flex flex-col gap-2">
              <item.icon className="h-6 w-6 text-laiton-400" />
              <p className="text-sm font-semibold text-white">{item.titre}</p>
              <p className="text-xs leading-5 text-graphite-400">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comment ça marche — anciennement une carte flottante dans le hero,
          devenue sa propre section (11/08/2026) avec l'ancre nav dédiée. */}
      <section id="comment-ca-marche" className="mx-auto w-full max-w-4xl px-6 py-20 sm:px-10">
        <div className="text-center">
          <SectionLabel>Comment ça marche</SectionLabel>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
            Simplement, en trois étapes.
          </h2>
        </div>
        <ol className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {COMMENT_CA_MARCHE.map(([numero, titre, description]) => (
            <li key={numero} className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-laiton-400/30 bg-laiton-400/10 text-base font-semibold text-laiton-300">
                {numero}
              </span>
              <p className="text-base font-semibold text-white">{titre}</p>
              <p className="max-w-xs text-sm leading-6 text-graphite-400">{description}</p>
            </li>
          ))}
        </ol>
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
      <section id="fondateur" className="coai-founder-stage relative mx-auto my-8 grid w-[calc(100%-2rem)] max-w-6xl items-center gap-10 overflow-hidden rounded-[2.5rem] border border-white/[0.08] px-6 py-16 text-center shadow-2xl sm:px-12 md:grid-cols-2 md:py-20 md:text-left">
        <div className="coai-founder-orbit" aria-hidden="true" />
        <div className="mx-auto flex flex-col items-center gap-4 md:order-first md:items-start">
          <div className="relative h-72 w-64 overflow-hidden rounded-[2rem] border border-laiton-300/35 shadow-[0_28px_80px_rgba(0,0,0,.48),0_0_45px_rgba(201,162,98,.12)] sm:h-96 sm:w-80">
            <Image
              src="/anthony-darmon-fondateur-coai.jpg"
              alt="Anthony Darmon, fondateur de COAI"
              fill
              priority
              sizes="(min-width: 640px) 20rem, 16rem"
              className="object-cover"
            />
          </div>
          <div className="flex items-center justify-center gap-2.5">
            <a
              href="https://instagram.com/anthonydarmoncoach"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-graphite-700 text-graphite-300 transition hover:border-laiton-400/40 hover:text-laiton-300"
            >
              <InstagramIcon className="h-4 w-4" />
            </a>
            <a
              href="https://www.linkedin.com/in/darmon-anthony-7a1303101"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-graphite-700 text-graphite-300 transition hover:border-laiton-400/40 hover:text-laiton-300"
            >
              <LinkedinIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-5 md:items-start">
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
          <p className="max-w-md text-sm leading-6 text-graphite-400">
            Tu peux aussi le croiser à Paris, à La Montgolfière Club ou au RITM Saint-Germain.
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
      <section id="histoire" className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-28">
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
      <section className="coai-future-cta relative mx-auto mb-16 flex w-[calc(100%-2rem)] max-w-6xl flex-col items-center gap-5 overflow-hidden rounded-[2.5rem] border border-laiton-300/20 px-6 py-20 text-center shadow-2xl sm:py-24">
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-laiton-300">Ton prochain chapitre</span>
        <h2 className="max-w-3xl font-display text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">Un coaching conçu pour ta vraie vie.</h2>
        <p className="max-w-2xl text-graphite-200">
          7 jours offerts, puis 19€/mois pour ton programme généré par IA — ou 49€/mois avec
          relecture et validation par un coach diplômé d&apos;État. Sans engagement.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/diagnostic"><Button>Faire mon diagnostic offert</Button></Link>
          <Link href="/pricing"><Button variant="secondary">Découvrir les offres</Button></Link>
        </div>
      </section>
    </main>
  );
}
