import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FounderWaitlistForm } from "@/components/marketing/founder-waitlist-form";

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
      <section className="flex min-h-[85vh] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
        <SectionLabel>Coaching · Suivi · IA</SectionLabel>
        <h1 className="text-4xl font-semibold tracking-tight text-graphite-50 sm:text-5xl">
          Anthony Darmon
          <span className="block text-laiton-400">— Coaching augmenté</span>
        </h1>
        <p className="max-w-md text-graphite-300">
          Ton coach hybride, holistique. La méthode d&apos;Anthony Darmon, plus de 17 ans
          d&apos;expérience, condensée dans un programme généré pour toi — et supervisé
          par un vrai coach.
        </p>
        <p className="font-display text-lg text-graphite-100">
          L&apos;expertise humaine augmentée par l&apos;IA
        </p>
        <a href="#piliers">
          <Button variant="secondary">Voir comment ça marche</Button>
        </a>
      </section>

      {/* Positionnement */}
      <section className="mx-auto max-w-2xl px-6 py-16 text-center">
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
      <section id="piliers" className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-16">
        <div className="text-center">
          <SectionLabel>Ce que tu obtiens</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold text-graphite-50">Trois piliers, un seul objectif</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PILIERS.map((pilier) => (
            <Card key={pilier.titre} className="flex flex-col gap-2">
              <SectionLabel>{pilier.titre}</SectionLabel>
              <p className="text-sm text-graphite-300">{pilier.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Crédibilité */}
      <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 px-6 py-16 text-center">
        <SectionLabel>La méthode</SectionLabel>
        <div className="relative h-64 w-64 overflow-hidden rounded-lg border border-graphite-800 sm:h-72 sm:w-72">
          <Image
            src="/anthony-darmon.jpg"
            alt="Anthony Darmon — THE METHOD"
            fill
            className="object-cover"
          />
        </div>
        <p className="max-w-sm text-sm text-graphite-400">
          THE METHOD by Anthony Darmon — expert en coaching sportif depuis plus de 17 ans,
          spécialiste des dirigeants et entrepreneurs. Le coaching augmenté s&apos;appuie
          sur cette méthode pour générer ton programme, sans attendre le coaching 1-to-1.
        </p>
      </section>

      {/* Liste d'attente */}
      <section
        id="cercle-fondateur"
        className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 px-6 py-16 text-center"
      >
        <SectionLabel>Accès en avant-première</SectionLabel>
        <h2 className="text-3xl font-semibold text-graphite-50">Le Cercle Fondateur</h2>
        <p className="max-w-lg text-graphite-300">
          Rejoins les premiers membres qui contribueront à façonner cette nouvelle
          expérience de coaching. Tu recevras les informations de lancement et un accès
          prioritaire dès l&apos;ouverture.
        </p>
        <FounderWaitlistForm />
      </section>

      {/* FAQ */}
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-16">
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
      <section className="flex flex-col items-center gap-4 px-6 py-20 text-center">
        <h2 className="text-2xl font-semibold text-graphite-50">Prêt à commencer ?</h2>
        <p className="text-graphite-300">
          Offre de lancement : <span className="line-through text-graphite-500">89€</span>{" "}
          49€/mois, sans engagement.
        </p>
        <Link href="/pricing">
          <Button>Découvrir l&apos;offre</Button>
        </Link>
      </section>
    </main>
  );
}
