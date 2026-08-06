import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FAQ = [
  {
    question: "Est-ce que c'est juste un robot, ou un vrai coach ?",
    reponse:
      "Les deux : l'IA génère ton programme à partir de ton profil, mais rien n'apparaît chez toi sans être relu et validé par Anthony Darmon. Tu ne reçois jamais un contenu IA brut.",
  },
  {
    question: "C'est adapté si je suis débutant ?",
    reponse:
      "Oui — ton niveau, ton équipement et tes contraintes de santé font partie du profil pris en compte pour générer et valider ton programme.",
  },
  {
    question: "C'est payant dès le départ ?",
    reponse:
      "Non — la création de compte et le suivi (séances, mesures, progression) sont gratuits. Le programme généré par IA et validé par un coach diplômé d'État démarre à 49€/mois, sans engagement, quand tu es prêt.",
  },
  {
    question: "Quelle est la différence avec THE METHOD (coaching 1-to-1) ?",
    reponse:
      "Le coaching augmenté te donne un point de départ structuré et suivi, gratuit puis à partir de 49€/mois pour le programme généré par IA. THE METHOD est un accompagnement 1-to-1 complet avec Anthony. Tu peux commencer avec ce format, puis passer à THE METHOD quand tu veux aller plus loin.",
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
      "Entraînement, nutrition et récupération construits autour de ton niveau, de tes objectifs et de tes contraintes.",
  },
  {
    numero: "02",
    titre: "Une progression visible",
    description:
      "Tes séances, tes mesures et tes progrès réunis dans un suivi simple qui évolue avec toi.",
  },
  {
    numero: "03",
    titre: "Une présence au quotidien",
    description:
      "L’IA t’accompagne à tout moment. Anthony supervise la méthode et valide ce qui compte.",
  },
];

export default function LandingPage() {
  return (
    <main className="bg-lab-grid flex flex-col">
      <section className="mx-auto grid min-h-[92vh] w-full max-w-7xl items-center gap-12 px-6 pb-20 pt-36 sm:px-10 sm:pt-40 lg:grid-cols-[1.05fr_.95fr] lg:py-28">
        <div className="relative z-10 max-w-3xl">
          <SectionLabel>Le coaching humain, augmenté</SectionLabel>
          <h1 className="mt-7 max-w-4xl font-display text-[clamp(3rem,6.4vw,6.4rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-white">
            Comprendre.<br />Progresser. <span className="yumai-gradient-text">Durer.</span>
          </h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-graphite-200 sm:text-lg">Ton coaching personnalisé par l’IA, construit sur 17 ans d’expertise humaine.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/sign-up"><Button className="px-7 py-3">Créer mon espace gratuit</Button></Link>
            <a href="#piliers"><Button variant="secondary" className="px-7 py-3">Découvrir la méthode</Button></a>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-graphite-400"><span className="h-1.5 w-1.5 rounded-full bg-laiton-400 shadow-[0_0_10px_#c9a262]" />IA disponible maintenant · validation humaine incluse</p>
        </div>
        <div className="relative flex min-h-[30rem] items-center justify-center lg:min-h-[38rem]">
          <div className="yumai-orb" aria-hidden="true" />
          <div className="absolute bottom-8 left-1/2 w-[min(92%,28rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/60 p-4 shadow-2xl backdrop-blur-xl lg:bottom-10 lg:left-0 lg:translate-x-0">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-laiton-400">Programme adaptatif</p><p className="mt-1.5 text-sm font-medium text-white">Semaine optimisée par YUMAI</p></div><span className="rounded-full bg-laiton-400/10 px-2.5 py-1 text-xs font-medium text-laiton-300">Validé</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[["4","séances"],["82%","récupération"],["+12","progression"]].map(([value,label]) => <div key={label} className="rounded-xl bg-white/[0.04] p-3"><p className="text-xl font-semibold text-white">{value}</p><p className="mt-1 text-[0.65rem] font-medium uppercase tracking-wide text-graphite-400">{label}</p></div>)}</div>
          </div>
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
            className="flex min-h-72 flex-col items-start justify-between gap-8 px-7 py-8 text-left"
            >
              <span className="text-sm font-semibold text-laiton-400">{pilier.numero}</span>
              <div>
                <h3 className="text-2xl font-semibold leading-tight tracking-[-0.025em] text-white">{pilier.titre}</h3>
                <p className="mt-4 text-base leading-7 text-graphite-300">{pilier.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Crédibilité */}
      <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-6 py-24 text-center md:grid-cols-2 md:text-left">
        <div className="relative mx-auto h-72 w-64 overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl sm:h-96 sm:w-80 md:order-first">
          <Image
            src="/anthony-darmon.jpg"
            alt="Anthony Darmon — THE METHOD"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col items-center gap-5 md:items-start">
          <SectionLabel>La méthode</SectionLabel>
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
            L&apos;IA ne remplace pas l&apos;expertise. Elle l&apos;amplifie.
          </h2>
          <p className="max-w-md text-base leading-7 text-graphite-300">
            THE METHOD by Anthony Darmon — expert en coaching sportif depuis plus de 17 ans,
            spécialiste des dirigeants et entrepreneurs. Le coaching augmenté s&apos;appuie
            sur cette méthode pour générer ton programme, sans attendre le coaching 1-to-1.
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
          Crée gratuitement ton espace et ton suivi. Quand tu es prêt, active ton programme
          personnalisé par l&apos;IA et validé par Anthony, à partir de 49€/mois sans engagement.
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
          Crée ton compte gratuitement, puis active ton programme personnalisé à partir de
          49€/mois, sans engagement.
        </p>
        <Link href="/sign-up">
          <Button>Commencer</Button>
        </Link>
      </section>
    </main>
  );
}
