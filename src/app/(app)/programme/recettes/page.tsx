import { RecettesGrid } from "@/components/nutrition/recettes-grid";
import { RECETTES } from "@/lib/nutrition/recettes";
import { getStockPhotos } from "@/lib/media/pexels";

// Bibliothèque de recettes (19/08/2026, demande Anthony). Même gabarit que
// /programme/exercices (kicker + titre + intro, bibliothèque indépendante du
// plan nutrition généré par l'IA). Les photos Pexels sont résolues ici,
// côté serveur, une seule fois pour toute la liste — la clé PEXELS_API_KEY
// ne quitte jamais le serveur.
export default async function RecettesPage() {
  const photos = await getStockPhotos(RECETTES.map((r) => r.photoQuery));
  const items = RECETTES.map((recette) => ({ recette, photoUrl: photos[recette.photoQuery] ?? null }));

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Bibliothèque</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Recettes.</h1>
        <p className="max-w-2xl text-base leading-7 text-graphite-300">
          Une sélection de recettes simples et équilibrées, indépendante de ton plan nutrition
          personnalisé — de quoi t&apos;inspirer au quotidien. Les macros indiquées sont des
          estimations par portion, pas un calcul exact.
        </p>
      </div>
      <RecettesGrid items={items} />
    </div>
  );
}
