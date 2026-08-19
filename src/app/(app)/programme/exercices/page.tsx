import { ExerciceCatalogue } from "@/components/exercices/exercice-catalogue";
import { EXERCICES } from "@/lib/exercices/catalogue";
import { getStockPhotos } from "@/lib/media/pexels";

// Photos résolues côté serveur pour les 48 exercices en une fois (19/08/2026,
// même traitement que /programme/recettes) — la clé PEXELS_API_KEY ne quitte
// jamais le serveur, et changer un filtre côté client ne redéclenche aucun
// appel réseau.
export default async function ExercicesPage() {
  const photos = await getStockPhotos(EXERCICES.map((ex) => ex.photoQuery));

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Bibliothèque</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Catalogue d&apos;exercices.</h1>
        <p className="max-w-2xl text-base leading-7 text-graphite-300">
          Une bibliothèque de référence indépendante de ton programme du jour — filtre par groupe musculaire,
          matériel disponible ou type de mouvement pour trouver de quoi varier ou compléter une séance.
        </p>
      </div>
      <ExerciceCatalogue photos={photos} />
    </div>
  );
}
