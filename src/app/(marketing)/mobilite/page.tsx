import Image from "next/image";
import { SectionLabel } from "@/components/ui/section-label";
import { Card } from "@/components/ui/card";
import { HeroOrb } from "@/components/marketing/hero-orb";
import { SubscribeButton } from "@/components/compte/subscribe-button";

export const metadata = { title: "Le test de hanche de 10 secondes — YUMAI" };

const MECANISME = [
  {
    titre: "Ton profil",
    description:
      "Tu réponds à quelques questions sur ton quotidien, tes douleurs, ton niveau et tes objectifs.",
  },
  {
    titre: "L'IA génère",
    description:
      "Un programme sur mesure est généré à partir de ton profil — entraînement, nutrition, récupération.",
  },
  {
    titre: "Anthony valide",
    description:
      "Rien ne t'arrive sans être relu et validé par Anthony Darmon, coach diplômé d'État.",
  },
];

const FEATURES_STANDARD = [
  "Tout le palier Gratuit",
  "Programme entraînement + nutrition + récupération généré par IA",
  "Relu et validé par Anthony Darmon, coach diplômé d'État",
  "Coach IA illimité",
  "Bibliothèque vidéo (yoga, mobilité, récupération…)",
  "Assistant WhatsApp 24/7",
];

export default function MobilitePage() {
  return (
    <main className="bg-lab-grid flex flex-col">
      {/* Hero */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 py-20 text-center">
        <HeroOrb />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <SectionLabel>Guide offert · Mobilité</SectionLabel>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-graphite-50 sm:text-6xl">
            Ce guide traite le symptôme.
            <br />
            <span className="text-laiton-400">YUMAI construit la solution sur mesure.</span>
          </h1>
          <p className="max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
            Les 5 exercices que tu viens de recevoir soulagent — mais ta posture, ton niveau
            et tes objectifs sont uniques. YUMAI génère un programme personnalisé par IA,
            validé par Anthony Darmon, coach diplômé d&apos;État.
          </p>
        </div>
      </section>

      {/* VSL placeholder */}
      <section className="mx-auto w-full max-w-3xl px-6 pb-20">
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          {/*
            Remplace ce bloc par la vidéo VSL une fois tournée (script fourni),
            par ex. un <video> ou un <iframe> YouTube/Vimeo en unlisted.
          */}
          <div className="flex flex-col items-center gap-3 text-graphite-400">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-laiton-400/40 text-laiton-400">
              ▶
            </div>
            <p className="font-mono text-xs uppercase tracking-widest">VSL à venir</p>
          </div>
        </div>
      </section>

      {/* Le constat */}
      <section className="mx-auto max-w-3xl border-y border-white/[0.07] px-6 py-20 text-center">
        <SectionLabel>Le constat</SectionLabel>
        <p className="mt-3 text-lg text-graphite-200">
          Un programme générique, tu le suis deux semaines, puis tu abandonnes — pas par
          manque de volonté, mais parce qu&apos;il n&apos;a jamais été conçu pour ta réalité :
          ton emploi du temps, ta morphologie, tes douleurs précises.
        </p>
      </section>

      {/* Mécanisme */}
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-24">
        <div className="text-center">
          <SectionLabel>Comment ça marche</SectionLabel>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-graphite-50 sm:text-4xl">
            L&apos;IA génère. Anthony valide.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {MECANISME.map((etape, i) => (
            <Card
              key={etape.titre}
              className="flex min-h-56 flex-col items-center justify-center gap-4 px-8 text-center"
            >
              <span className="font-mono text-xs uppercase tracking-widest text-laiton-400">
                Étape {i + 1}
              </span>
              <h3 className="text-xl font-bold tracking-wide text-graphite-50">{etape.titre}</h3>
              <p className="max-w-xs text-base leading-7 text-graphite-300">{etape.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Crédibilité */}
      <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-6 py-24 text-center md:grid-cols-2 md:text-left">
        <div className="relative mx-auto h-72 w-64 overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl sm:h-96 sm:w-80 md:order-first">
          <Image src="/anthony-darmon.jpg" alt="Anthony Darmon — YUMAI" fill className="object-cover" />
        </div>
        <div className="flex flex-col items-center gap-5 md:items-start">
          <SectionLabel>Ton coach</SectionLabel>
          <h2 className="text-3xl font-semibold tracking-tight text-graphite-50 sm:text-4xl">
            17 ans d&apos;expérience, pas un chatbot livré à lui-même.
          </h2>
          <p className="max-w-md text-base leading-7 text-graphite-300">
            Anthony Darmon, coach diplômé d&apos;État, spécialiste des dirigeants et
            entrepreneurs, relit et valide personnellement chaque programme généré pour toi.
            L&apos;IA accélère, l&apos;humain garantit.
          </p>
        </div>
      </section>

      {/* Offre */}
      <section className="mx-auto my-16 flex w-[calc(100%-3rem)] max-w-2xl flex-col items-center gap-6 rounded-[2rem] border border-laiton-400/20 bg-white/[0.035] px-6 py-12 text-center shadow-[0_40px_120px_-60px_rgba(201,162,98,0.35)] backdrop-blur sm:px-12 sm:py-16">
        <SectionLabel>L&apos;offre</SectionLabel>
        <h2 className="text-3xl font-semibold tracking-tight text-graphite-50 sm:text-4xl">
          YUMAI Standard
        </h2>
        <div className="flex items-baseline gap-1">
          <p className="text-5xl font-semibold text-graphite-50">49€</p>
          <span className="text-sm text-graphite-400">/mois, sans engagement</span>
        </div>
        <ul className="flex w-full max-w-sm flex-col gap-2 text-left text-sm text-graphite-300">
          {FEATURES_STANDARD.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="mt-0.5 text-laiton-400">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <SubscribeButton plan="STANDARD" label="Découvrir YUMAI Standard" />
      </section>

      {/* CTA final */}
      <section className="flex flex-col items-center gap-5 border-t border-white/[0.07] px-6 py-24 text-center">
        <h2 className="text-2xl font-semibold text-graphite-50">Prêt à passer à l&apos;étape suivante ?</h2>
        <p className="max-w-md text-graphite-300">
          Ton programme personnalisé, généré par IA et validé par Anthony, t&apos;attend.
        </p>
        <SubscribeButton plan="STANDARD" label="Commencer maintenant" />
      </section>
    </main>
  );
}
