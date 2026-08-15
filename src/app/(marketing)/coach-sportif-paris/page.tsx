import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BackLink } from "@/components/marketing/back-link";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { RelatedSeoLinks } from "@/components/marketing/related-seo-links";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const TITLE = "Coach sportif à Paris — COAI";
const DESCRIPTION =
  "Anthony Darmon, coach sportif diplômé d'État à Paris, 17 ans d'expérience : séances individuelles en présentiel ou accompagnement à distance avec programme généré par IA et validé par un coach.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/coach-sportif-paris" },
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website", url: "/coach-sportif-paris" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const VIP_MESSAGE =
  "Bonjour Anthony, je suis tombé sur COAI et j'aimerais réserver une séance à Paris.";

const FAQ_ITEMS = [
  {
    question: "Où se déroulent les séances en présentiel ?",
    reponse: "Les séances individuelles VIP se déroulent à Paris centre, ou en visioconférence si tu préfères.",
  },
  {
    question: "Faut-il forcément venir en présentiel à Paris ?",
    reponse:
      "Non — l'abonnement COAI (programme généré par IA, validé par un coach diplômé d'État) fonctionne entièrement à distance, où que tu sois. Le présentiel à Paris est réservé aux séances VIP individuelles, en option.",
  },
  {
    question: "Quelle est l'expérience du coach ?",
    reponse:
      "Anthony Darmon est coach diplômé d'État, avec plus de 17 ans d'expérience en coaching sportif, spécialiste des dirigeants et entrepreneurs.",
  },
  {
    question: "Combien coûte une séance individuelle à Paris ?",
    reponse:
      "200€ la séance en présentiel à Paris centre (1h), ou 100€ en visioconférence — réservation flexible, sans abonnement ni engagement.",
  },
];

export default function CoachSportifParisPage() {
  const vipHref = buildWhatsAppLink(VIP_MESSAGE);

  return (
    <main className="coai-landing-lux flex min-h-screen flex-col items-center gap-10 px-6 py-24">
      <div className="w-full max-w-3xl pt-8">
        <BackLink />
      </div>

      <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
        <div className="text-center md:text-left">
          <SectionLabel>Coach sportif à Paris</SectionLabel>
          <h1 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-5xl">
            Un coach sportif diplômé d&apos;État à Paris, en présentiel ou à distance.
          </h1>
          <p className="mt-6 text-base leading-7 text-graphite-300 sm:text-lg">
            Anthony Darmon accompagne ses clients à Paris depuis plus de 17 ans. Séances
            individuelles en présentiel ou en visio, ou accompagnement COAI à distance avec un
            programme généré par IA et validé par un coach.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            {vipHref ? (
              <a href={vipHref} target="_blank" rel="noopener noreferrer">
                <Button>Réserver une séance à Paris</Button>
              </a>
            ) : (
              <Link href="/pricing">
                <Button>Voir les offres</Button>
              </Link>
            )}
            <Link href="/sign-up">
              <Button variant="secondary">Essayer COAI — 7 jours offerts</Button>
            </Link>
          </div>
        </div>
        <div className="relative mx-auto h-72 w-64 overflow-hidden rounded-[2rem] border border-laiton-400/25 shadow-2xl sm:h-96 sm:w-80">
          <Image
            src="/anthony-darmon-portrait.jpg"
            alt="Anthony Darmon, coach sportif à Paris"
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-5 py-10 sm:grid-cols-2">
        <Card className="flex flex-col gap-3 text-center">
          <h2 className="text-lg font-semibold text-white">Séances individuelles à Paris</h2>
          <p className="text-sm leading-6 text-graphite-300">
            200€ en présentiel (Paris centre, 1h) ou 100€ en visioconférence — réservation
            flexible, sans engagement.
          </p>
        </Card>
        <Card className="flex flex-col gap-3 text-center">
          <h2 className="text-lg font-semibold text-white">Accompagnement COAI à distance</h2>
          <p className="text-sm leading-6 text-graphite-300">
            Programme généré par IA dès 19€ (paiement unique), ou avec relecture et validation
            par un coach diplômé d&apos;État à 49€/mois — accessible depuis n&apos;importe où.
          </p>
        </Card>
      </div>

      <SeoFaq items={FAQ_ITEMS} />

      <RelatedSeoLinks currentPath="/coach-sportif-paris" />

      <section className="flex flex-col items-center gap-5 px-6 pt-6 text-center">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.035em] text-white sm:text-4xl">
          Envie de commencer ?
        </h2>
        <Link href="/pricing">
          <Button>Voir toutes les offres</Button>
        </Link>
      </section>
    </main>
  );
}
