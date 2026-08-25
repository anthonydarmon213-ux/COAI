import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CoaiIntro } from "@/components/marketing/coai-intro";
import { MarqueeBanner } from "@/components/marketing/marquee-banner";
import { Reveal } from "@/components/marketing/reveal";
import { AdaptatifIcon, SuiviIcon, ValidationIcon, SecuriteIcon } from "@/components/marketing/feature-icons";
import { InstagramIcon, LinkedinIcon } from "@/components/ui/social-icons";
import { TrackConversion } from "@/components/analytics/track-conversion";

const TITLE = "COAI — Ton Personal Trainer, toujours avec toi";
const DESCRIPTION =
  "Personal Training, Reimagined. Une expérience de coaching personnalisée, disponible 24h/24, avec la rapidité de l’IA et la précision d’un coach humain.";

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
    question: "Pourquoi pas juste demander ça à une IA généraliste ?",
    reponse:
      "Une IA généraliste ne connaît pas la progression, les seuils de charge ou les précautions à prendre selon une contrainte de santé — elle invente une réponse plausible. COAI applique les règles concrètes qu'Anthony Darmon utilise depuis plus de 17 ans de coaching sportif réel (dosage, progression, prudence sur les blessures) pour construire ton programme, pas une réponse générique tirée d'internet.",
  },
  {
    question: "Est-ce que c'est juste un robot, ou un vrai coach ?",
    reponse:
      "Les deux. L'IA reste disponible 24h/24 et adapte rapidement le programme. En Coaching Hybride et en VIP, l'humain apporte son regard, sa nuance et ses ajustements. Tu choisis le niveau d'attention dont tu as besoin.",
  },
  {
    question: "C'est adapté si je suis débutant ?",
    reponse:
      "Oui — ton niveau, ton équipement et tes contraintes de santé font partie du profil pris en compte pour générer et valider ton programme.",
  },
  {
    question: "C'est payant dès le départ ?",
    reponse:
      "Le diagnostic est offert. Ensuite, Pass IA coûte 19,99€/mois (ou 119€/an), Coaching Hybride 99€/mois et VIP démarre à 199€/mois. Les deux premières formules incluent 7 jours d'essai.",
  },
  {
    question: "Je peux résilier quand je veux ?",
    reponse: "Oui. Les trois formules sont des abonnements mensuels sans engagement, résiliables à tout moment depuis ton compte.",
  },
  {
    question: "Et si mon programme ne me convient pas ?",
    reponse:
      "Il évolue avec ton temps disponible, ta forme, ton sommeil, tes douleurs et tes progrès. En Coaching Hybride et en VIP, l'humain peut aussi intervenir pour affiner les décisions importantes.",
  },
  {
    question: "Mes données sont-elles en sécurité ?",
    reponse:
      "Oui — hébergement en UE (RGPD), paiement géré directement par Stripe (COAI ne voit jamais ta carte bancaire), et tu peux exporter ou supprimer tes données à tout moment depuis ton compte.",
  },
];

const FONCTIONNALITES_HERO = [
  { icon: AdaptatifIcon, titre: "Programme adaptatif", description: "Ajusté chaque semaine selon ta forme, ton énergie et le temps dont tu disposes ce jour-là." },
  { icon: SuiviIcon, titre: "Suivi intelligent", description: "COAI analyse tes performances, ta récupération et ton quotidien." },
  { icon: ValidationIcon, titre: "Validation humaine", description: "Un coach vérifie et optimise là où l'IA a ses limites." },
  { icon: SecuriteIcon, titre: "Sécurisé & privé", description: "Tes données sont protégées, jamais revendues." },
];

const COMMENT_CA_MARCHE = [
  ["1", "Ton coach apprend à te connaître", "Objectifs, niveau, antécédents, douleurs, habitudes et attention souhaitée."],
  ["2", "Tu fais ton check-in du jour", "Temps disponible, sommeil, forme, alimentation et éventuelles gênes — en moins d'une minute."],
  ["3", "Tu suis la séance adaptée", "Échauffement, exercices, retour au calme et suivi : chaque retour améliore la prochaine séance."],
];

const PARCOURS_PERSONAL_TRAINING = [
  {
    plage: "01—03",
    offre: "Gratuit · Sans carte",
    titre: "Comprendre ton point de départ",
    description: "Tu découvres ton profil et tes priorités avant de choisir un accompagnement.",
    etapes: [
      "01 · Bilan initial : objectifs, niveau, antécédents, douleurs et habitudes",
      "02 · Évaluation physique : mobilité, posture, cardio, force et mouvements",
      "03 · Définition des objectifs : précis, mesurables, réalistes et datés",
    ],
    href: "/diagnostic",
    cta: "Faire mon bilan offert",
    miseEnAvant: false,
  },
  {
    plage: "04—07",
    offre: "Pass IA · 19,99€/mois",
    titre: "Commencer avec Pass IA",
    description: "Si tu veux commencer, COAI crée ton programme et te guide pendant chaque séance.",
    etapes: [
      "04 · Programme personnalisé et progressif",
      "05 · Échauffement : 5 à 10 min de mobilité et d’activation",
      "06 · Séance : technique, renforcement, cardio ou travail spécifique",
      "07 · Retour au calme : respiration, mobilité légère et récupération",
    ],
    href: "/pricing#impulsion",
    cta: "Commencer avec Pass IA",
    miseEnAvant: true,
  },
  {
    plage: "08",
    offre: "Coaching Hybride · 99€/mois",
    titre: "Ajouter le suivi humain",
    description: "Tu passes à Coaching Hybride seulement si tu veux un regard extérieur, des retours et des ajustements.",
    etapes: ["08 · Suivi : performances, sensations et douleurs consignées après chaque séance"],
    href: "/pricing#transformation",
    cta: "Découvrir Coaching Hybride",
    miseEnAvant: false,
  },
  {
    plage: "09—10",
    offre: "VIP · dès 199€/mois",
    titre: "Atteindre un objectif exigeant",
    description: "Le VIP intervient uniquement si ton objectif demande une attention maximale et des ajustements approfondis.",
    etapes: [
      "09 · Ajustements et réévaluation structurée toutes les 4 à 6 semaines",
      "10 · Atteindre ton objectif et définir la suite",
    ],
    href: "/pricing#vip",
    cta: "Voir le niveau VIP",
    miseEnAvant: false,
  },
];

const PILIERS_VISUELS = [
  {
    numero: "01",
    categorie: "Entraînement",
    titre: "S’entraîner",
    description: "La bonne séance, adaptée à ta forme et à ton objectif.",
    image: "/exercices/back-squat-barre.jpg",
    position: "object-[52%_center]",
  },
  {
    numero: "02",
    categorie: "Nutrition",
    titre: "Bien manger",
    description: "Des repas simples et gourmands, alignés avec ton objectif.",
    image: "/repas/plat-saumon-quinoa-brocolis.jpg",
    position: "object-center",
  },
  {
    numero: "03",
    categorie: "Récupération",
    titre: "Récupérer",
    description: "Mobilité, sommeil et détente pour progresser durablement.",
    image: "/recuperation/hammam-femme-blonde-premium.jpg",
    position: "object-[48%_center]",
  },
];

function PiliersVisuelsSection() {
  return (
    <Reveal>
      <section id="piliers" className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 sm:py-20">
        <div className="text-center">
          <SectionLabel>Une méthode complète</SectionLabel>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
            Trois piliers. Une seule direction.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-graphite-300 sm:text-lg">
            Ton corps ne progresse pas uniquement pendant la séance. COAI coordonne ton entraînement,
            ton alimentation et ta récupération.
          </p>
        </div>
        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-3">
          {PILIERS_VISUELS.map((pilier) => (
            <div key={pilier.titre} className="flex flex-col gap-4">
              <article className="group relative min-h-[30rem] overflow-hidden rounded-[2rem] border border-white/[0.1] bg-graphite-900 shadow-[0_32px_90px_-42px_rgba(0,0,0,.95)]">
                <Image
                  src={pilier.image}
                  alt={`${pilier.titre} avec COAI`}
                  fill
                  sizes="(max-width: 767px) calc(100vw - 3rem), 33vw"
                  className={`object-cover transition duration-700 ease-out group-hover:scale-[1.035] ${pilier.position}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/5" />
                <div className="absolute inset-x-0 bottom-0 p-7 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-laiton-300">
                    {pilier.numero} · {pilier.categorie}
                  </p>
                  <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-white">
                    {pilier.titre}
                  </h3>
                  <p className="mt-3 max-w-xs text-sm leading-6 text-white/75">{pilier.description}</p>
                </div>
              </article>
              {pilier.categorie === "Récupération" ? (
                <Link
                  href="/diagnostic"
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-laiton-400 px-6 text-center text-sm font-semibold text-graphite-950 shadow-[0_16px_45px_-18px_rgba(212,175,55,.8)] transition hover:-translate-y-0.5 hover:bg-laiton-300"
                >
                  Faire mon bilan initial offert →
                </Link>
              ) : null}
            </div>
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
    </Reveal>
  );
}

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://coai.fr/#organization",
      name: "COAI",
      url: "https://coai.fr/",
      logo: "https://coai.fr/icon",
      founder: { "@id": "https://coai.fr/#anthony-darmon" },
      sameAs: [
        "https://instagram.com/anthonydarmoncoach",
        "https://www.linkedin.com/in/darmon-anthony-7a1303101",
      ],
    },
    {
      "@type": "Person",
      "@id": "https://coai.fr/#anthony-darmon",
      name: "Anthony Darmon",
      jobTitle: "Coach sportif diplômé d’État",
      worksFor: { "@id": "https://coai.fr/#organization" },
    },
    {
      "@type": "Service",
      "@id": "https://coai.fr/#personal-training",
      name: "COAI — Personal Training augmenté",
      provider: { "@id": "https://coai.fr/#organization" },
      areaServed: "FR",
      description: DESCRIPTION,
      offers: [
        { "@type": "Offer", name: "Pass IA", price: "19.99", priceCurrency: "EUR" },
        { "@type": "Offer", name: "Coaching Hybride", price: "99", priceCurrency: "EUR" },
        { "@type": "Offer", name: "VIP", price: "199", priceCurrency: "EUR" },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQ.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.reponse },
      })),
    },
  ],
};

function LandingPageHistorique() {
  return (
    <main className="coai-color-surface bg-lab-grid flex flex-col after:hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }}
      />
      <TrackConversion name="landing_viewed" />
      <CoaiIntro />
      <MarqueeBanner />

      {/* Les trois visuels incarnent l'offre dès le haut de la page, avant
          les explications produit plus détaillées. */}
      <PiliersVisuelsSection />

      {/* Maquette de l'app (23/08/2026, fournie par Anthony) — remplace la
          vidéo anatomique qui s'affichait en rectangle noir : preload="none"
          empêchait le navigateur de charger le poster ET bloquait
          l'autoplay, donc rien ne s'affichait. Une image rend le même
          service ici, sans dépendre du bon vouloir des politiques
          d'autoplay, et pèse 132 Ko contre 534 Ko.
          next/image sert automatiquement WebP/AVIF selon le navigateur ;
          priority parce que c'est le visuel principal en haut de page. */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-10 sm:px-10" aria-label="L'application COAI">
        <div className="overflow-hidden rounded-[1.75rem] border border-white/[0.09] bg-[#0D0E12]">
          <Image
            src="/coai-app-mockup.jpg"
            alt="L'application COAI : anneaux de macros, Vision Nutri, cartographie musculaire et score de readiness"
            width={1600}
            height={873}
            priority
            className="h-auto w-full"
          />
        </div>
      </section>

      <section className="coai-live-signals mx-auto w-full max-w-6xl px-6 pt-10 sm:px-10" aria-label="Les signaux suivis par COAI">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-[#111518] px-5 py-7 sm:px-8">
          <div className="coai-live-signals-glow" aria-hidden="true" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-sm">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#4cc9f0]">COAI Intelligence · En mouvement</p>
              <h2 className="mt-2 font-display text-2xl text-white sm:text-3xl">Ton évolution devient visible.</h2>
              <p className="mt-2 text-sm leading-6 text-graphite-400">Des chiffres simples, des couleurs vivantes et un point de départ que tu peux réellement faire progresser.</p>
              <div className="coai-motion-copy mt-5" aria-label="COAI analyse tes données puis adapte ton programme">
                <span>01 · COAI comprend ton point de départ</span>
                <span>02 · Tes signaux deviennent des décisions</span>
                <span>03 · Ton programme évolue avec toi</span>
              </div>
            </div>
            <div className="coai-motion-dashboard relative grid grid-cols-5 gap-2 overflow-hidden rounded-2xl border border-white/[0.06] bg-black/10 px-2 py-5 sm:gap-4 sm:px-4">
              <i className="coai-motion-scan" aria-hidden="true" />
              {[
                ["Entraînement", "#ff8a3d", "72"],
                ["Nutrition", "#ffd84d", "81"],
                ["Récupération", "#39e67b", "64"],
                ["Sommeil", "#4cc9f0", "76"],
                ["Score COAI", "#c56cff", "74"],
              ].map(([label, color, score], index) => (
                <div key={label} className="coai-mini-signal" style={{ "--signal-color": color, "--signal-delay": `${index * 120}ms` } as React.CSSProperties}>
                  <div className="coai-mini-signal-ring"><strong>{score}</strong><span>%</span></div>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ligne de fonctionnalités sous le hero — reprend exactement les
          garde-fous déjà mis en avant ailleurs sur la page (adaptatif,
          suivi, validation humaine, sécurité), condensés en un coup d'œil. */}
      <section className="coai-color-features mx-auto w-full max-w-6xl border-t border-white/[0.06] px-6 py-12 sm:px-10">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {FONCTIONNALITES_HERO.map((item) => (
            <div key={item.titre} className="coai-color-feature flex flex-col gap-2 rounded-2xl px-4 py-5">
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
            <li key={numero} className="coai-color-step flex flex-col items-center gap-3 rounded-[1.5rem] px-5 py-6 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-laiton-400/30 bg-laiton-400/10 text-base font-semibold text-laiton-300">
                {numero}
              </span>
              <p className="text-base font-semibold text-white">{titre}</p>
              <p className="max-w-xs text-sm leading-6 text-graphite-400">{description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-20 sm:px-10" aria-labelledby="parcours-pt-title">
        <div className="text-center">
          <SectionLabel>Ton parcours Personal Training</SectionLabel>
          <h2 id="parcours-pt-title" className="mx-auto mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
            Du bilan initial à l&apos;atteinte de ton objectif.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-graphite-300">
            Tu commences gratuitement. Pass IA te donne tout le nécessaire pour avancer. Tu ajoutes ensuite de l&apos;attention humaine seulement si ton objectif le demande.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {PARCOURS_PERSONAL_TRAINING.map((phase) => (
            <article
              key={phase.plage}
              className={`coai-color-phase flex flex-col rounded-[1.75rem] border p-6 ${phase.miseEnAvant ? "border-laiton-300/70 bg-laiton-300/[0.10] shadow-[0_28px_80px_-35px_rgba(201,162,98,.65)]" : "border-white/[0.09] bg-white/[0.035]"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs tracking-[0.16em] text-laiton-300">{phase.plage}</span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-graphite-200">{phase.offre}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-white">{phase.titre}</h3>
              <p className="mt-3 text-sm leading-6 text-graphite-300">{phase.description}</p>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-graphite-200">
                {phase.etapes.map((etape) => (
                  <li key={etape} className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-laiton-300">✓</span>
                    <span>{etape}</span>
                  </li>
                ))}
              </ul>
              <div className="flex-1" />
              <Link href={phase.href} className={`mt-7 inline-flex min-h-12 items-center justify-center rounded-full px-5 text-center text-sm font-semibold transition ${phase.miseEnAvant ? "bg-laiton-400 text-graphite-950 hover:bg-laiton-300" : "border border-white/15 text-white hover:border-laiton-300/50 hover:text-laiton-200"}`}>
                {phase.cta}
              </Link>
            </article>
          ))}
        </div>

        <div className="coai-score-signature mx-auto mt-10 flex max-w-3xl flex-col items-center justify-between gap-5 overflow-hidden rounded-[1.75rem] border border-laiton-300/25 bg-laiton-300/[0.06] px-7 py-7 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-semibold text-white">Ton Score COAI reste ton fil rouge.</p>
            <p className="mt-1 text-sm text-graphite-300">Un point de départ mesurable, puis un repère concret pour voir le chemin parcouru.</p>
          </div>
          <Link href="/diagnostic" className="shrink-0 text-sm font-semibold text-laiton-200 underline decoration-laiton-300/40 underline-offset-4">
            Découvrir mon Score COAI →
          </Link>
        </div>

        <div className="coai-live-metrics mx-auto mt-5 grid max-w-3xl gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-3">
          <div className="bg-[#111210] px-5 py-4 text-center">
            <strong className="block font-display text-2xl text-white">45–60</strong>
            <span className="mt-1 block text-xs text-graphite-400">durée habituelle d’une séance</span>
          </div>
          <div className="bg-[#111210] px-5 py-4 text-center">
            <strong className="block font-display text-2xl text-white">2–3</strong>
            <span className="mt-1 block text-xs text-graphite-400">par semaine pour débuter</span>
          </div>
          <div className="bg-[#111210] px-5 py-4 text-center">
            <strong className="block font-display text-2xl text-white">4–6</strong>
            <span className="mt-1 block text-xs text-graphite-400">avant chaque réévaluation</span>
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
      <Reveal>
      <section id="fondateur" className="coai-founder-stage relative mx-auto my-8 grid w-[calc(100%-2rem)] max-w-6xl items-center gap-10 overflow-hidden rounded-[2.5rem] border border-white/[0.08] px-6 py-16 text-center shadow-2xl sm:px-12 md:grid-cols-2 md:py-20 md:text-left">
        <div className="coai-founder-orbit" aria-hidden="true" />
        <div className="mx-auto flex flex-col items-center gap-4 md:order-first md:items-start">
          <div className="relative aspect-square w-64 overflow-hidden rounded-[2rem] border border-laiton-300/35 shadow-[0_28px_80px_rgba(0,0,0,.48),0_0_45px_rgba(201,162,98,.12)] sm:w-80">
            <Image
              src="/anthony-trx-studio-premium.jpg"
              alt="Anthony Darmon en séance TRX dans un studio de coaching premium"
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
            spécialiste des dirigeants et entrepreneurs. De cette expérience terrain est né
            COAI — pour rendre cette expertise accessible à tous, sans attendre le
            coaching 1-to-1.
          </p>
          <p className="max-w-md text-sm leading-6 text-graphite-400">
            Tu peux aussi le croiser à Paris, à La Montgolfière Club ou au RITM Saint-Germain.
          </p>
          <Link href="/pricing#vip" className="text-sm font-medium text-laiton-400 underline hover:text-laiton-300">
            Découvrir notre formule VIP →
          </Link>
        </div>
      </section>
      </Reveal>

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
            jamais. Un accompagnement 1-to-1 aussi exigeant coûte normalement 490 à 800€ par mois.
          </p>
          <p className="mt-7 border-l-2 border-laiton-400 pl-6 italic text-white">
            Mais l&apos;expertise ne devrait pas être un luxe. Et un algorithme seul ne devrait
            jamais avoir le dernier mot sur un corps.
          </p>
          <p className="mt-7">
            COAI est né de cette tension : le Personal Training réimaginé. L&apos;IA apporte la
            rapidité et une présence 24h/24 ; l&apos;humain apporte le regard, la subtilité et les
            ajustements décisifs. Tu choisis une expérience Pass IA, Coaching Hybride ou VIP.
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

      {/* Démonstration produit : rendre l'expérience tangible avant de
          poursuivre le discours de marque. Mockup d'interface plutôt qu'une
          photo (19/08/2026, Anthony a repéré que la photo précédente était
          strictement la même que le hero juste au-dessus) — reprend les
          mêmes classes CSS que la section "Ton évolution devient visible"
          (.coai-mini-signal/-ring) pour une cohérence totale avec ce que
          Anthony a validé plus haut, plutôt qu'un nouveau style ou une
          nouvelle photo à trouver. */}
      <Reveal>
        <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-20 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#0b0d0f] shadow-2xl">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 82% 8%, rgba(196,154,82,.2), transparent 55%), radial-gradient(circle at 8% 92%, rgba(76,201,240,.16), transparent 55%)",
              }}
              aria-hidden="true"
            />
            <div className="relative flex h-full flex-col justify-center gap-4 p-6 sm:p-9">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div>
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-laiton-300">Aujourd&apos;hui</p>
                  <p className="mt-1 text-base font-semibold text-white">Bonjour Anthony.</p>
                  <p className="mt-0.5 text-xs text-graphite-400">Séance jambes · 45 min</p>
                </div>
                <div className="coai-mini-signal-ring" style={{ "--signal-color": "#c56cff" } as React.CSSProperties}>
                  <strong>74</strong>
                  <span>Score</span>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-graphite-500">Séance du jour</p>
                <p className="mt-1.5 text-sm font-semibold text-white">Squat · 4 × 8</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-2/3 rounded-full bg-laiton-400" />
                </div>
              </div>

              <div className="flex justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                {[
                  ["Entraînement", "#ff8a3d", "72"],
                  ["Nutrition", "#ffd84d", "81"],
                  ["Récupération", "#39e67b", "64"],
                ].map(([label, color, score]) => (
                  <div key={label} className="coai-mini-signal">
                    <div className="coai-mini-signal-ring" style={{ "--signal-color": color } as React.CSSProperties}>
                      <strong>{score}</strong>
                      <span>%</span>
                    </div>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <SectionLabel>Dans le produit</SectionLabel>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
              Tu vois quoi faire, et pourquoi.
            </h2>
            <p className="mt-5 text-base leading-7 text-graphite-300">
              COAI transforme tes réponses en décisions concrètes : une priorité claire, une séance adaptée et un suivi qui garde la mémoire de ta progression.
            </p>
            <ol className="mt-8 space-y-5">
              {[
                ["01", "Bilan", "Ton niveau, tes objectifs, tes contraintes et tes douleurs sont pris en compte."],
                ["02", "Séance du jour", "Le contenu s’ajuste à ton temps disponible et à ta forme réelle."],
                ["03", "Progression", "Tes retours alimentent la prochaine séance et rendent l’évolution mesurable."],
              ].map(([numero, titre, description]) => (
                <li key={numero} className="grid grid-cols-[2.5rem_1fr] gap-3">
                  <span className="font-mono text-xs tracking-widest text-laiton-300">{numero}</span>
                  <div>
                    <h3 className="font-semibold text-white">{titre}</h3>
                    <p className="mt-1 text-sm leading-6 text-graphite-400">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/diagnostic" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-laiton-400 px-6 text-sm font-semibold text-graphite-950 transition hover:bg-laiton-300">
              Faire mon bilan COAI gratuit
            </Link>
            <p className="mt-3 text-xs text-graphite-500">Gratuit · moins de 5 minutes · sans carte bancaire</p>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <section className="relative mx-auto my-10 aspect-[4/5] w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/[0.1] shadow-[0_38px_100px_-45px_rgba(0,0,0,.8)] sm:aspect-[16/9]">
          <Image
            src="/coai-recovery-palace.png"
            alt="Une séance de récupération adaptée à la forme et au temps disponible"
            fill
            sizes="(min-width: 1280px) 72rem, 96vw"
            className="coai-palace-image object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent sm:bg-gradient-to-r sm:from-black/80 sm:via-black/25 sm:to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col p-6 sm:inset-y-0 sm:left-0 sm:right-auto sm:max-w-xl sm:justify-end sm:p-12">
            <SectionLabel>Une méthode qui vit avec toi</SectionLabel>
            <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-white sm:text-5xl">
              Aujourd&apos;hui n&apos;est jamais une journée standard.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/80 sm:text-lg sm:leading-8">
              COAI adapte chaque séance à ton agenda, au temps dont tu disposes et à ta forme du jour — effort, récupération ou repos.
            </p>
          </div>
        </section>
      </Reveal>

      {/* Coach IA 24/7 — différenciateur qu'aucun concurrent 100% manuel
          (type TrueCoach) ne peut proposer : une vraie présence permanente,
          pas juste un programme statique. Depuis le 11/08/2026, seul
          Pass IA garde un quota (4 questions/mois) — Coaching Hybride est
          illimité (cf. /api/coach/ask), donc "disponible 24/7" est un vrai
          avantage du palier supérieur, pas qu'une promesse marketing. */}
      <Reveal>
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
            "Répond en quelques secondes grâce à 17 ans d'expérience terrain structurée",
            "Ton coach humain reste dans la boucle pour ce qui compte vraiment",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5 text-sm leading-6 text-graphite-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-laiton-400 shadow-[0_0_10px_#c9a262]" />
              {item}
            </div>
          ))}
        </div>
        <Link href="/diagnostic" className="mt-4">
          <Button>Essayer le Coach IA</Button>
        </Link>
      </section>
      </Reveal>

      {/* Accès aux offres */}
      <Reveal>
      <section
        id="offres"
        className="mx-auto my-16 flex w-[calc(100%-3rem)] max-w-3xl flex-col items-center gap-6 rounded-[2rem] border border-laiton-400/20 bg-white/[0.035] px-6 py-12 text-center shadow-[0_40px_120px_-60px_rgba(201,162,98,0.35)] backdrop-blur sm:px-12 sm:py-16"
      >
        <SectionLabel>Choisis ton accompagnement</SectionLabel>
        <h2 className="font-display text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">
          Commence à ton rythme.
        </h2>
        <p className="max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          Pass IA à 19,99€/mois (ou 119€/an), Coaching Hybride à 99€/mois ou VIP dès 199€/mois. Trois niveaux
          d&apos;attention, un même objectif : te guider simplement jusqu&apos;au résultat.
        </p>
        <Link href="/pricing">
          <Button>Comparer les accompagnements</Button>
        </Link>
      </section>
      </Reveal>

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
      <Reveal>
      <section className="coai-future-cta relative mx-auto mb-16 flex w-[calc(100%-2rem)] max-w-6xl flex-col items-center gap-5 overflow-hidden rounded-[2.5rem] border border-laiton-300/20 px-6 py-20 text-center shadow-2xl sm:py-24">
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-laiton-300">Ton prochain chapitre</span>
        <h2 className="max-w-3xl font-display text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">Un coaching conçu pour ta vraie vie.</h2>
        <p className="max-w-2xl text-graphite-200">
          Ton Personal Trainer, toujours avec toi. Commence avec Pass IA, ajoute le regard humain
          avec Coaching Hybride, ou choisis l&apos;attention maximale du VIP.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/diagnostic"><Button>Faire mon diagnostic offert</Button></Link>
          <Link href="/pricing"><Button variant="secondary">Voir les formules</Button></Link>
        </div>
      </section>
      </Reveal>
    </main>
  );
}

const PARCOURS_COURT = [
  ["01", "Bilan gratuit", "Moins de 5 minutes, sans carte bancaire."],
  ["02", "Résultat personnalisé", "Ton profil, tes priorités et ton point de départ."],
  ["03", "Compte gratuit", "Tu sauvegardes ton résultat avant de choisir."],
  ["04", "Choix de la formule", "Pass IA, Coaching Hybride ou VIP."],
  ["05", "Essai de 7 jours", "Inclus avec Pass IA et Coaching Hybride, avant le premier prélèvement."],
  ["06", "Programme activé", "Entraînement, alimentation et récupération coordonnés."],
  ["07", "Première séance", "COAI te guide immédiatement, étape par étape."],
] as const;

export default function LandingPage() {
  return (
    <main className="coai-color-surface bg-lab-grid flex flex-col after:hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA).replace(/</g, "\\u003c") }}
      />
      <TrackConversion name="landing_viewed" />
      <CoaiIntro />

      <section id="comment-ca-marche" className="mx-auto w-full max-w-6xl scroll-mt-20 px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <SectionLabel>Simple du début à la première séance</SectionLabel>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Tu sais toujours où tu en es.
          </h2>
          <p className="mt-4 text-base leading-7 text-graphite-300">
            Ton bilan et ton résultat restent gratuits. Tu crées ensuite ton compte, choisis ta formule et testes COAI pendant 7 jours.
          </p>
        </div>
        <ol className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {PARCOURS_COURT.map(([numero, titre, texte], index) => (
            <li key={numero} className={`rounded-3xl border px-5 py-6 ${index === PARCOURS_COURT.length - 1 ? "border-laiton-300/45 bg-laiton-300/[0.08]" : "border-white/[0.08] bg-white/[0.03]"}`}>
              <span className="font-mono text-[10px] tracking-[0.2em] text-cyan-300">ÉTAPE {numero}</span>
              <h3 className="mt-3 text-lg font-semibold text-white">{titre}</h3>
              <p className="mt-2 text-sm leading-6 text-graphite-400">{texte}</p>
            </li>
          ))}
        </ol>
        <div className="mt-9 text-center">
          <Link href="/diagnostic"><Button>Commencer mon bilan gratuit</Button></Link>
          <p className="mt-3 text-xs text-graphite-500">Aucune carte bancaire · résultat immédiat · sans engagement</p>
        </div>
      </section>

      <PiliersVisuelsSection />

      <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-20 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
        <div>
          <SectionLabel>17 ans de terrain</SectionLabel>
          <h2 className="mt-5 font-display text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            La technologie accélère. Le coach garde le cap.
          </h2>
          <p className="mt-5 text-base leading-7 text-graphite-300">
            COAI transforme ton bilan en actions concrètes. Selon la formule choisie, Anthony apporte aussi son regard humain sur les décisions importantes.
          </p>
        </div>
        <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-laiton-300/20">
          <Image src="/anthony-studio-premium.jpg" alt="Anthony Darmon, coach sportif diplômé d'État" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
        <div className="text-center"><SectionLabel>Questions essentielles</SectionLabel></div>
        <div className="flex flex-col gap-3">
          {FAQ.slice(0, 4).map((item) => (
            <Card key={item.question}>
              <details>
                <summary className="cursor-pointer list-none text-base font-semibold text-white marker:content-none">{item.question}</summary>
                <p className="mt-3 text-sm leading-6 text-graphite-300">{item.reponse}</p>
              </details>
            </Card>
          ))}
        </div>
      </section>

      <section className="coai-future-cta relative mx-auto mb-16 flex w-[calc(100%-2rem)] max-w-6xl flex-col items-center gap-5 overflow-hidden rounded-[2.5rem] border border-laiton-300/20 px-6 py-20 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-laiton-300">Étape 1 sur 7</span>
        <h2 className="max-w-3xl font-display text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">Découvre ton point de départ.</h2>
        <p className="max-w-2xl text-graphite-200">Le bilan est offert. Tu verras ton résultat avant de créer un compte ou de choisir une formule.</p>
        <Link href="/diagnostic"><Button>Faire mon bilan gratuit</Button></Link>
      </section>
    </main>
  );
}
