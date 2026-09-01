import { ProgrammesPretsGrid } from "@/components/programme/programmes-prets-grid";
import { PROGRAMMES_PRETS } from "@/lib/programmes-prets/catalogue";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { hasCatalogueAccess } from "@/lib/subscription/plan";
import Link from "next/link";
import { PROGRAMME_DECOUVERTE_GRATUIT_SLUG } from "@/lib/programmes-prets/experience";

// Bibliothèque de programmes prêts à l'emploi (19/08/2026, demande Anthony) —
// même gabarit que /programme/exercices et /programme/recettes : une
// bibliothèque indépendante du programme généré par l'IA, jamais bloquante
// ni en remplacement. Les cartes utilisent uniquement la photothèque COAI.
export default async function ProgrammesPretsPage({
  searchParams,
}: {
  searchParams?: { achat?: string };
}) {
  const user = await getCurrentAppUser();
  const achats = user
    ? await prisma.programmePurchase.findMany({
        where: { userId: user.id },
        select: { programmePrincipal: true, programmeOffert: true },
      })
    : [];
  const programmesAchetes = new Set(
    achats.flatMap(({ programmePrincipal, programmeOffert }) => [programmePrincipal, programmeOffert])
  );
  const accesComplet = user ? hasCatalogueAccess(user.subscription) : false;
  const items = PROGRAMMES_PRETS.map((programme, index) => ({
    programme,
    // Parité COAI mémorisée : alternance des couvertures femme/homme,
    // indépendamment du profil, pour représenter toute la communauté.
    photoUrl: (index % 2 === 0
      ? programme.photoFemme ?? programme.photoHomme
      : programme.photoHomme ?? programme.photoFemme) ?? "/coai-programme-adaptatif.jpg",
    gratuit: programme.slug === PROGRAMME_DECOUVERTE_GRATUIT_SLUG,
    deverrouille: programme.slug === PROGRAMME_DECOUVERTE_GRATUIT_SLUG || accesComplet || programmesAchetes.has(programme.slug),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Boutique COAI</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Choisis ton programme. Garde-le à vie.</h1>
        <p className="max-w-2xl text-base leading-7 text-graphite-300">
          Une sélection de programmes ciblés — mobilité, stretch, abdos, préparation de course,
          perte de poids, Pilates, yoga et spécial fessiers — indépendante de ton programme
          personnalisé généré par IA. Mobilité est offert pour découvrir la méthode. Les autres packs
          sont disponibles à l&apos;unité ; l&apos;abonnement ajoute ensuite le suivi, les conseils et les adaptations continues.
        </p>
      </div>
      {searchParams?.achat === "success" && (
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.07] p-4 text-sm text-emerald-100">
          <p className="font-semibold">Merci, ton paiement est en cours de confirmation.</p>
          <p className="mt-1 leading-6 text-graphite-300">
            Tes deux programmes apparaissent ici dès la confirmation Stripe. Après ta première semaine,
            partage-nous ton retour : chaque avis sert à améliorer les prochains cycles COAI.
          </p>
          <Link href="/avis" className="mt-2 inline-flex font-semibold text-emerald-200 underline underline-offset-4">
            Donner mon avis sur COAI
          </Link>
        </div>
      )}
      {searchParams?.achat === "cancel" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-graphite-300">
          Aucun paiement n&apos;a été effectué. Tes choix sont conservés uniquement pendant cette visite.
        </div>
      )}
      <ProgrammesPretsGrid items={items} connecte={Boolean(user)} suiviInclus={accesComplet} />
    </div>
  );
}
