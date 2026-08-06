import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FounderWaitlistForm } from "@/components/marketing/founder-waitlist-form";
import { HeroOrb } from "@/components/marketing/hero-orb";

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
    question: "Quelle est la différence avec THE METHOD (coaching 1-to-1) ?",
    reponse:
      "Le coaching augmenté te donne un point de départ structuré et suivi, à 49€/mois. THE METHOD est un accompagnement 1-to-1 complet avec Anthony. Tu peux commencer avec ce format, puis passer à THE METHOD quand tu veux aller plus loin.",
  },
  {
    question: "Je peux résilier quand je veux ?",
    reponse: "Oui, l'abonnement est sans engagement — tu résilies à tout moment depuis ton compte.",
  },
];

const PILIERS = [
  {
    titre: "Coaching",
    description:
      "Un programme généré spécifiquement pour toi à partir de ton profil (objectifs, niveau, équipement, contraintes) — entraînement, nutrition, récupération. Jamais un programme générique recyclé.",
  },
  {
    titre: "Suivi",
    description:
      "Journal de séances, mesures corporelles et photos de progression, avec des graphiques pour voir concrètement ton évolution dans le temps.",
  },
  {
    titre: "IA",
    description:
      "Un assistant disponible 24/7 sur WhatsApp pour répondre à tes questions et t'accompagner au quotidien, entre deux séances.",
  },
];

export default function LandingPage() {
  return (
    <main className="bg-lab-grid flex flex-col">
      {/* Hero */}
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center gap-6 px-6 py-20 text-center">
        <HeroOrb />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <SectionLabel>Coaching · Suivi · IA</SectionLabel>
          <h1 className="text-6xl font-semibold tracking-[-0.06em] text-graphite-50 sm:text-8xl">
            YUMAI
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.4em] text-laiton-400">
            HI × AI™
          </p>
          <p className="max-w-2xl font-display text-2xl leading-tight text-graphite-100 sm:text-4xl">
            AI generates. Humans validate.
          </p>
          <p className="text-sm uppercase tracking-[0.18em] text-graphite-400">
            L&apos;expertise humaine augmentée par l&apos;IA
          </p>
          <p className="max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
            Un coaching augmenté par l&apos;IA, supervisé par un vrai coach avec 17 ans
            d&apos;expérience. L&apos;IA génère, l&apos;humain valide — rien ne t&apos;est
            envoyé sans passer par moi. Disponible dès aujourd&apos;hui.
          </p>
          <Link href="/sign-up">
            <Button>Commencer</Button>
          </Link>
        </div>
      </section>

      {/* Positionnement */}
      <section className="mx-auto max-w-3xl border-y border-white/[0.07] px-6 py-20 text-center">
        <SectionLabel>Le constat</SectionLabel>
        <p className="mt-3 text-lg text-graphite-200">
          Tu veux progresser sérieusement, mais tu n&apos;es pas encore prêt à investir
          dans un coaching 1-to-1. Le coaching augmenté te donne un vrai point de départ :
          un programme pensé pour toi, un suivi structuré, et un accompagnement
          disponible à tout moment — sans le prix ni l&apos;engagement d&apos;un coach
          personnel.
        </p>
      </section>

      {/* Les 3 piliers */}
      <section id="piliers" className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-24">
        <div className="text-center">
          <SectionLabel>Ce que tu obtiens</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-graphite-50 sm:text-4xl">Trois piliers, un seul objectif</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PILIERS.map((pilier) => (
            <Card
              key={pilier.titre}
              className="flex min-h-56 flex-col items-center justify-center gap-5 px-8 text-center"
            >
              <h3 className="text-xl font-bold tracking-wide text-laiton-400 sm:text-2xl">
                {pilier.titre}
              </h3>
              <p className="max-w-xs text-base leading-7 text-graphite-300">
                {pilier.description}
              </p>
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
          <h2 className="text-3xl font-semibold tracking-tight text-graphite-50 sm:text-4xl">
            L&apos;IA ne remplace pas l&apos;expertise. Elle l&apos;amplifie.
          </h2>
          <p className="max-w-md text-base leading-7 text-graphite-300">
            THE METHOD by Anthony Darmon — expert en coaching sportif depuis plus de 17 ans,
            spécialiste des dirigeants et entrepreneurs. Le coaching augmenté s&apos;appuie
            sur cette méthode pour générer ton programme, sans attendre le coaching 1-to-1.
          </p>
        </div>
      </section>

      {/* Liste d'attente */}
      <section
        id="membres-fondateurs"
        className="mx-auto my-16 flex w-[calc(100%-3rem)] max-w-3xl flex-col items-center gap-6 rounded-[2rem] border border-laiton-400/20 bg-white/[0.035] px-6 py-12 text-center shadow-[0_40px_120px_-60px_rgba(201,162,98,0.35)] backdrop-blur sm:px-12 sm:py-16"
      >
        <SectionLabel>Accès en avant-première</SectionLabel>
        <h2 className="text-3xl font-semibold tracking-tight text-graphite-50 sm:text-4xl">
          Membres fondateurs YUMAI
        </h2>
        <p className="max-w-lg text-graphite-300">
          Rejoins les premiers membres qui contribueront à façonner cette nouvelle
          expérience de coaching. Tu recevras les informations de lancement et un accès
          prioritaire dès l&apos;ouverture.
        </p>
        <FounderWaitlistForm />
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
                  {item.question}
                </summary>
                <p className="mt-3 text-sm text-graphite-300">{item.reponse}</p>
              </details>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="flex flex-col items-center gap-5 border-t border-white/[0.07] px-6 py-24 text-center">
        <h2 className="text-2xl font-semibold text-graphite-50">Prêt à commencer ?</h2>
        <p className="text-graphite-300">
          Offre de lancement : <span className="line-through text-graphite-500">89€</span>{" "}
          49€/mois, sans engagement.
        </p>
        <Link href="/sign-up">
          <Button>Commencer</Button>
        </Link>
      </section>
    </main>
  );
}
