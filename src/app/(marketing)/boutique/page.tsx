import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProgrammesPretsGrid } from "@/components/programme/programmes-prets-grid";
import { PROGRAMMES_PRETS } from "@/lib/programmes-prets/catalogue";
import { PROGRAMME_DECOUVERTE_GRATUIT_SLUG } from "@/lib/programmes-prets/experience";
import { OFFRE_RENTREE_LABEL, PROGRAMME_UNITAIRE_PRIX_LABEL } from "@/lib/programmes-prets/offre";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { hasCatalogueAccess } from "@/lib/subscription/plan";

export const metadata: Metadata = {
  title: "Boutique programmes fitness, nutrition et récupération | COAI",
  description: "Découvre un programme COAI offert, puis choisis des packs complets à l'unité : entraînement, recettes, récupération et suivi de progression.",
  alternates: { canonical: "/boutique" },
};

async function BoutiqueProgrammes() {
  const user = await getCurrentAppUser();
  const accesComplet = user ? hasCatalogueAccess(user.subscription) : false;

  // Un abonnement actif déverrouille déjà tout le catalogue. Dans ce cas,
  // relire les achats unitaires ne change rien au résultat et ralentit chaque
  // navigation vers la Boutique d'un aller-retour base de données inutile.
  const achats = user && !accesComplet
    ? await prisma.programmePurchase.findMany({
        where: { userId: user.id },
        select: { programmePrincipal: true, programmeOffert: true },
      })
    : [];
  const programmesAchetes = new Set(
    achats.flatMap(({ programmePrincipal, programmeOffert }) => [programmePrincipal, programmeOffert]),
  );
  const items = PROGRAMMES_PRETS.map((programme) => {
    // Couvertures boutique : priorité aux modèles féminins, avec un fallback
    // homme uniquement si aucun visuel féminin n'est disponible.
    const photoUrl = programme.photoFemme ?? programme.photoHomme;
    const gratuit = programme.slug === PROGRAMME_DECOUVERTE_GRATUIT_SLUG;
    return {
      programme,
      photoUrl: photoUrl ?? "/coai-programme-adaptatif.jpg",
      gratuit,
      deverrouille: gratuit || accesComplet || programmesAchetes.has(programme.slug),
    };
  });

  return <ProgrammesPretsGrid items={items} connecte={Boolean(user)} suiviInclus={accesComplet} />;
}

function BoutiqueProgrammesSkeleton() {
  return (
    <div aria-label="Chargement des programmes" className="grid gap-5 md:grid-cols-2">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-white/10 bg-[#111518]">
          <div className="h-40 animate-pulse bg-white/[0.06]" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-3/4 animate-pulse rounded bg-white/[0.08]" />
            <div className="h-3 w-full animate-pulse rounded bg-white/[0.05]" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-white/[0.05]" />
            <div className="h-16 animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.025]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BoutiquePage({ searchParams }: { searchParams?: { achat?: string } }) {

  return (
    <main className="coai-landing-lux min-h-screen px-5 pb-24 pt-28 sm:px-8 sm:pt-32">
      <section className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-laiton-300">Boutique COAI · Packs autonomes</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
            Un programme complet. Sans abonnement obligatoire.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-graphite-300">
            Commence gratuitement avec Mobilité totale. Chaque pack premium réunit entraînement,
            calendrier, visuels, nutrition, recettes, récupération, bilan et check-in hebdomadaire.
          </p>
        </div>

        <div className="mx-auto mt-8 grid max-w-4xl gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.06] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-200">Découverte</p>
            <p className="mt-2 text-lg font-semibold text-white">1 programme offert</p>
            <p className="mt-1 text-xs leading-5 text-graphite-300">Mobilité totale, accessible immédiatement et conservé à vie.</p>
          </div>
          <div className="rounded-2xl border border-laiton-300/30 bg-laiton-300/[0.07] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-laiton-200">Tarif lancement</p>
            <p className="mt-2 text-lg font-semibold text-white">{PROGRAMME_UNITAIRE_PRIX_LABEL} · paiement unique</p>
            <p className="mt-1 text-xs leading-5 text-graphite-300">{OFFRE_RENTREE_LABEL}. Aucun renouvellement automatique.</p>
          </div>
          <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.06] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-cyan-200">Besoin de suivi ?</p>
            <p className="mt-2 text-lg font-semibold text-white">Passe au coaching adaptatif</p>
            <p className="mt-1 text-xs leading-5 text-graphite-300">Ajustements, conseils et adaptations selon tes résultats avec l&apos;abonnement.</p>
            <Link href="/pricing" className="mt-2 inline-flex text-xs font-bold text-cyan-100 underline underline-offset-4">Voir les accompagnements →</Link>
          </div>
        </div>

        {searchParams?.achat === "success" && (
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4 text-sm text-emerald-100">
            <p className="font-semibold">Paiement confirmé : tes deux programmes vont se déverrouiller automatiquement.</p>
            <p className="mt-1 text-graphite-300">Recharge cette page dans quelques secondes si la confirmation Stripe est encore en cours.</p>
          </div>
        )}
        {searchParams?.achat === "cancel" && (
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-graphite-300">
            Aucun paiement n&apos;a été effectué.
          </div>
        )}

        <div className="mt-10">
          <Suspense fallback={<BoutiqueProgrammesSkeleton />}>
            <BoutiqueProgrammes />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
