import { RecettesGrid } from "@/components/nutrition/recettes-grid";
import { RECETTES } from "@/lib/nutrition/recettes";
import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { hasPaidSubscription } from "@/lib/subscription/plan";

// Bibliothèque de recettes (19/08/2026, demande Anthony). Même gabarit que
// /programme/exercices (kicker + titre + intro, bibliothèque indépendante du
// plan nutrition généré par l'IA). Une photo COAI explicitement associée au
// plat passe toujours avant Pexels : on ne montre jamais une assiette voisine
// sous prétexte qu'elle partage un ingrédient.
// Trois recettes offertes en démonstration, le reste avec l'abonnement
// (01/09/2026, demande Anthony) : la bibliothèque est un actif éditorial,
// elle se goûte mais ne se donne pas entière.
const RECETTES_OFFERTES = 3;

export default async function RecettesPage() {
  const user = await getCurrentAppUser();
  const abonne = hasPaidSubscription(user?.subscription);
  const visibles = abonne ? RECETTES : RECETTES.slice(0, RECETTES_OFFERTES);
  const items = visibles.map((recette) => ({
    recette,
    photoUrl: recette.photoLocale ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Bibliothèque</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Recettes.</h1>
        <p className="max-w-2xl text-base leading-7 text-graphite-300">
          {abonne ? RECETTES.length : RECETTES_OFFERTES} recettes simples et équilibrées avec portions, préparation, conservation et variantes
          pour les programmes LEAN, RESET, TRX, HYBRID et MASS. Les macros restent des estimations
          par portion : adapte les quantités à ton profil et vérifie toujours les allergènes.
        </p>
      </div>
      <RecettesGrid items={items} />
      {!abonne && (
        <div className="rounded-2xl border border-laiton-300/25 bg-[linear-gradient(130deg,rgba(201,162,98,.10),rgba(255,255,255,.02))] p-6 text-center">
          <p className="font-display text-lg font-semibold text-[#fffdf8]">
            {RECETTES.length - RECETTES_OFFERTES} autres recettes t&apos;attendent
          </p>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-graphite-300">
            Portions, macros, conservation et variantes pour chaque plat — avec les visuels COAI.
          </p>
          <Link href="/pricing" className="mt-4 inline-flex rounded-full bg-laiton-300 px-5 py-2.5 text-sm font-bold text-[#101214] transition hover:bg-laiton-200">
            Débloquer les {RECETTES.length} recettes →
          </Link>
        </div>
      )}
    </div>
  );
}
