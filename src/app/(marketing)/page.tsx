import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { NB_EXERCICES_FILMES, NB_RECETTES } from "@/lib/catalogue-chiffres";
import { CompteAReboursRentree } from "@/components/marketing/compte-a-rebours-rentree";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CoaiIntro } from "@/components/marketing/coai-intro";
import { Reveal } from "@/components/marketing/reveal";
import { TrackConversion } from "@/components/analytics/track-conversion";

const TITLE = "COAI — Ton Personal Trainer, toujours avec toi";
// "Longévité" ajouté le 04/09/2026 (demande Anthony, inspiration enseigne
// "bangji — Longevity Skincare") : le thème existait déjà dans le
// positionnement (âge métabolique, -15 ans visés) mais n'apparaissait pas
// dans la promesse principale — ajout additif, sans retirer "Personal
// Training, Reimagined." qui reste la baseline reconnue.
const DESCRIPTION =
  "Coaching longévité, Personal Training réimaginé. Une expérience de coaching personnalisée, disponible 24h/24, avec la rapidité de l’IA et la précision d’un coach humain.";

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
      "Les deux. L'IA reste disponible 24h/24 et adapte rapidement le programme. En Full Remote et en Full Présentiel VIP, Anthony lui-même apporte son regard, sa nuance et ses ajustements. Tu choisis le niveau d'attention dont tu as besoin.",
  },
  {
    question: "C'est adapté si je suis débutant ?",
    reponse:
      "Oui — ton niveau, ton équipement et tes contraintes de santé font partie du profil pris en compte pour générer et valider ton programme.",
  },
  {
    question: "C'est payant dès le départ ?",
    reponse:
      "Le diagnostic est offert. Ensuite, Full IA coûte 19,99€/mois (ou 119€/an), avec 7 jours d'essai. Full Remote (coaching 1:1 à distance avec Anthony, 1 200 € les 3 mois soit 400€/mois, 15 places max) et Full Présentiel VIP (200 € la séance, 10/mois max) se règlent sur devis, via WhatsApp.",
  },
  {
    question: "Je peux résilier quand je veux ?",
    reponse: "Oui. Les trois formules sont des abonnements mensuels sans engagement, résiliables à tout moment depuis ton compte.",
  },
  {
    question: "Et si mon programme ne me convient pas ?",
    reponse:
      "Il évolue avec ton temps disponible, ta forme, ton sommeil, tes douleurs et tes progrès. En Full Remote et en Full Présentiel VIP, Anthony peut aussi intervenir pour affiner les décisions importantes.",
  },
  {
    question: "Mes données sont-elles en sécurité ?",
    reponse:
      "Oui — hébergement en UE (RGPD), paiement géré directement par Stripe (COAI ne voit jamais ta carte bancaire), et tu peux exporter ou supprimer tes données à tout moment depuis ton compte.",
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
        { "@type": "Offer", name: "Full IA", price: "19.99", priceCurrency: "EUR" },
        { "@type": "Offer", name: "Full Remote", price: "1200", priceCurrency: "EUR" },
        { "@type": "Offer", name: "Full Présentiel VIP", price: "200", priceCurrency: "EUR" },
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

const PARCOURS_COURT = [
  ["01", "Bilan gratuit", "Moins de 5 minutes, sans carte bancaire."],
  ["02", "Résultat personnalisé", "Ton profil, tes priorités et ton point de départ."],
  ["03", "Compte gratuit", "Tu sauvegardes ton résultat avant de choisir."],
  ["04", "Choix de la formule", "Full IA, Full Remote ou Full Présentiel VIP."],
  ["05", "Essai de 7 jours", "Inclus avec Full IA, avant le premier prélèvement."],
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
        <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-laiton-300/20 sm:min-h-[420px]">
          <Image src="/anthony-studio-premium.jpg" alt="Anthony Darmon, coach sportif diplômé d'État" fill sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover object-[center_30%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        </div>
      </section>


      {/* Teaser court pour les deux offres avec Anthony (Full Remote,
          Full Présentiel VIP) + lien vers /pricing, qui porte déjà le détail
          complet des deux (tarifs, WhatsApp, formulaire) — évite de doubler
          cette page sur la home (simplification demandée par Anthony suite
          au retour de Mickaël, 04/09/2026 ; mis à jour le même jour pour le
          repositionnement 3 offres Full IA / Full Remote / Full Présentiel
          VIP). */}
      <Reveal>
      <section
        id="coaching-anthony"
        className="mx-auto my-8 flex w-[calc(100%-2rem)] max-w-4xl flex-col items-center gap-5 overflow-hidden rounded-[2.5rem] border border-laiton-300/25 bg-laiton-300/[0.04] px-6 py-14 text-center sm:px-12"
        aria-labelledby="coaching-anthony-title"
      >
        <SectionLabel>Full Remote · Full Présentiel VIP</SectionLabel>
        <h2
          id="coaching-anthony-title"
          className="max-w-2xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl"
        >
          Anthony te coache lui-même, à distance ou en personne.
        </h2>
        <p className="max-w-xl text-base leading-7 text-graphite-300 sm:text-lg">
          Full Remote : coaching 1:1 à distance, 1 200 € les 3 mois (soit 400 €/mois), 15 places max. Full Présentiel VIP :
          chez toi, en entreprise, en club ou à distance, 200 € la séance, 10/mois max. Les deux sur devis.
        </p>
        <Link
          href="/pricing"
          className="rounded-full bg-laiton-300 px-7 py-3.5 text-sm font-semibold text-[#0d0d0c] transition hover:bg-laiton-200"
        >
          Découvrir les formules
        </Link>
      </section>
      </Reveal>

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

      <div className="mx-auto w-[calc(100%-2rem)] max-w-2xl">
        <CompteAReboursRentree />
      </div>

      {/* Ce que contient l'abonnement, en chiffres verifiables. La page
          expliquait comment COAI fonctionne sans jamais dire ce qu'on y
          trouve : un visiteur ignorait qu'il achete des centaines de
          contenus deja produits. */}
      <Reveal>
      <section
        className="mx-auto my-8 w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/[0.09] bg-white/[0.03] px-6 py-16 text-center sm:px-12 sm:py-20"
        aria-labelledby="tout-inclus-title"
      >
        <SectionLabel>Tout COAI, inclus</SectionLabel>
        <h2
          id="tout-inclus-title"
          className="mx-auto mt-5 max-w-3xl font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl"
        >
          Un seul accès. Tout ce qui existe,
          <br className="hidden sm:block" /> et tout ce qui arrive.
        </h2>

        <div className="mx-auto mt-12 grid max-w-5xl gap-px overflow-hidden rounded-[1.6rem] border border-white/[0.09] bg-white/[0.09] sm:grid-cols-2 lg:grid-cols-4">
          {[
            { chiffre: String(NB_RECETTES), titre: "recettes", texte: "Avec leurs macros. Végétarien, vegan, sans gluten, hyper-protéiné." },
            { chiffre: "13", titre: "programmes prêts", texte: "Dont 5 protocoles de récupération : sommeil, respiration, foam roller." },
            { chiffre: String(NB_EXERCICES_FILMES), titre: "exercices filmés", texte: "Démontrés par Anthony, pas des animations génériques." },
            { chiffre: "1", titre: "séance par jour", texte: "Recalculée selon ton sommeil, ta forme et ton temps." },
            { chiffre: "Rep", titre: "carnet de séances", texte: "Chaque série, chaque charge, ton tonnage et tes records." },
            { chiffre: "kcal", titre: "compteur intégré", texte: "Calories et macros au quotidien, sans peser si tu ne veux pas." },
            { chiffre: "24/7", titre: "coach IA", texte: "Disponible pendant la séance, dans le contexte de ton exercice." },
            { chiffre: "1-1", titre: "coach humain", texte: "Anthony relit et ajuste ton programme, selon ta formule." },
          ].map((bloc) => (
            <div key={bloc.titre} className="bg-[#0d0d0c]/95 p-6 text-left">
              <p className="font-display text-3xl font-semibold tracking-[-0.04em] text-laiton-300">{bloc.chiffre}</p>
              <p className="mt-1 text-sm font-semibold text-white">{bloc.titre}</p>
              <p className="mt-2 text-sm leading-6 text-graphite-400">{bloc.texte}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-base leading-7 text-graphite-300">
          Chaque nouvelle recette, chaque nouvelle vidéo, chaque amélioration :
          incluse, sans supplément.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/diagnostic">
            <Button>Faire mon bilan offert</Button>
          </Link>
        </div>
      </section>
      </Reveal>

      <section className="coai-future-cta relative mx-auto mb-16 flex w-[calc(100%-2rem)] max-w-6xl flex-col items-center gap-5 overflow-hidden rounded-[2.5rem] border border-laiton-300/20 px-6 py-20 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-laiton-300">Bilan offert · moins de 5 minutes</span>
        <h2 className="max-w-3xl font-display text-3xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">Découvre ton point de départ.</h2>
        <p className="max-w-2xl text-graphite-200">Le bilan est offert. Tu verras ton résultat avant de créer un compte ou de choisir une formule.</p>
        <Link href="/diagnostic"><Button>Faire mon bilan gratuit</Button></Link>
      </section>
    </main>
  );
}
