import { RecettesGrid } from "@/components/nutrition/recettes-grid";
import { RECETTES } from "@/lib/nutrition/recettes";

// Bibliothèque de recettes (19/08/2026, demande Anthony). Même gabarit que
// /programme/exercices (kicker + titre + intro, bibliothèque indépendante du
// plan nutrition généré par l'IA). Une photo COAI explicitement associée au
// plat passe toujours avant Pexels : on ne montre jamais une assiette voisine
// sous prétexte qu'elle partage un ingrédient.
export default function RecettesPage() {
  const items = RECETTES.map((recette) => ({
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
          {RECETTES.length} recettes simples et équilibrées avec portions, préparation, conservation et variantes
          pour les programmes LEAN, RESET, TRX, HYBRID et MASS. Les macros restent des estimations
          par portion : adapte les quantités à ton profil et vérifie toujours les allergènes.
        </p>
      </div>
      <RecettesGrid items={items} />
    </div>
  );
}
