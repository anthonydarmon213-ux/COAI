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
      <section className="mx-auto grid min-h-[92vh] w-full max-w-7xl items-center gap-12 px-6 pb-20 pt-24 sm:px-10 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div className="relative z-10 max-w-3xl">
          <SectionLabel>Le coaching humain, augmenté</SectionLabel>
          <h1 className="mt-6 font-editorial text-[clamp(3.4rem,7vw,7rem)] font-normal leading-[0.88] tracking-[-0.055em] text-white">
            Votre coaching.<br /><span className="italic text-laiton-300">Augmenté</span> par<br className="hidden sm:block" /> l’intelligence.
          </h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">Entraînement, nutrition, récupération et suivi réunis dans une expérience conçue par Anthony Darmon et personnalisée par l’IA.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/sign-up"><Button className="px-7 py-3">Créer mon espace gratuit</Button></Link>
            <a href="#piliers"><Button variant="secondary" className="px-7 py-3">Découvrir la méthode</Button></a>
          </div>
          <p className="mt-6 flex items-center gap-2 text-xs text-graphite-500"><span className="h-1.5 w-1.5 rounded-full bg-laiton-400 shadow-[0_0_10px_#c9a262]" />IA disponible maintenant · validation humaine incluse</p>
        </div>
        <div className="relative flex min-h-[30rem] items-center justify-center lg:min-h-[38rem]">
          <div className="yumai-orb" aria-hidden="true" />
          <div className="absolute bottom-8 left-1/2 w-[min(92%,28rem)] -translate-x-1/2 rounded-2xl border border-white/10 bg-black/60 p-4 shadow-2xl backdrop-blur-xl lg:bottom-10 lg:left-0 lg:translate-x-0">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3"><div><p className="font-mono text-[0.58rem] uppercase tracking-widest text-laiton-400">Programme adaptatif</p><p className="mt-1 text-sm text-white">Semaine optimisée par YUMAI</p></div><span className="rounded-full bg-laiton-400/10 px-2.5 py-1 text-[0.65rem] text-laiton-300">Validé</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[["4","séances"],["82%","récupération"],["+12","progression"]].map(([value,label]) => <div key={label} className="rounded-xl bg-white/[0.04] p-3"><p className="font-editorial text-xl text-white">{value}</p><p className="mt-1 text-[0.58rem] uppercase tracking-wide text-graphite-500">{label}</p></div>)}</div>
          </div>
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
          <h2 className="mt-4 font-editorial text-4xl font-normal tracking-tight text-graphite-50 sm:text-6xl">Tout ce qui compte pour progresser, enfin réuni.</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {PILIERS.map((pilier) => (
            <Card
              key={pilier.titre}
            className="flex min-h-64 flex-col items-center justify-center gap-5 px-8 text-center"
            >
              <h3 className="font-editorial text-3xl font-normal tracking-wide text-laiton-300">
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
          <h2 className="font-editorial text-4xl font-normal tracking-tight text-graphite-50 sm:text-6xl">
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

      {/* Early adopters */}
      <section
        id="membres-fondateurs"
        className="mx-auto my-16 flex w-[calc(100%-3rem)] max-w-3xl flex-col items-center gap-6 rounded-[2rem] border border-laiton-400/20 bg-white/[0.035] px-6 py-12 text-center shadow-[0_40px_120px_-60px_rgba(201,162,98,0.35)] backdrop-blur sm:px-12 sm:py-16"
      >
        <SectionLabel>Accès en avant-première</SectionLabel>
        <h2 className="font-editorial text-4xl font-normal tracking-tight text-graphite-50 sm:text-5xl">
          Membres fondateurs YUMAI
        </h2>
        <p className="max-w-lg text-graphite-300">
          Rejoins les premiers membres de YUMAI : ton tarif de lancement à 49€/mois reste
          garanti tant que ton abonnement est actif, même quand les prix évolueront pour les
          nouveaux inscrits.
        </p>
        <Link href="/sign-up">
          <Button>Devenir membre fondateur</Button>
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
        <h2 className="font-editorial text-4xl font-normal text-graphite-50 sm:text-5xl">Prêt à commencer ?</h2>
        <p className="text-graphite-300">
          Crée ton compte gratuitement, puis passe à ton rythme au programme généré par IA à
          partir de <span className="line-through text-graphite-500">89€</span> 49€/mois, sans
          engagement.
        </p>
        <Link href="/sign-up">
          <Button>Commencer</Button>
        </Link>
      </section>
    </main>
  );
}
