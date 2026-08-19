import { ProgrammesPretsGrid } from "@/components/programme/programmes-prets-grid";
import { PROGRAMMES_PRETS } from "@/lib/programmes-prets/catalogue";
import { getStockPhotos } from "@/lib/media/pexels";

// Bibliothèque de programmes prêts à l'emploi (19/08/2026, demande Anthony) —
// même gabarit que /programme/exercices et /programme/recettes : une
// bibliothèque indépendante du programme généré par l'IA, jamais bloquante
// ni en remplacement. Photos résolues côté serveur en une fois.
export default async function ProgrammesPretsPage() {
  const photos = await getStockPhotos(PROGRAMMES_PRETS.map((p) => p.photoQuery));
  const items = PROGRAMMES_PRETS.map((programme) => ({ programme, photoUrl: photos[programme.photoQuery] ?? null }));

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Bibliothèque</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Programmes prêts à l&apos;emploi.</h1>
        <p className="max-w-2xl text-base leading-7 text-graphite-300">
          Une sélection de programmes ciblés — mobilité, préparation de course, perte de poids,
          poids du corps, fessiers, challenge 30 jours — indépendante de ton programme
          personnalisé généré par IA. À suivre en plus, jamais à la place.
        </p>
      </div>
      <ProgrammesPretsGrid items={items} />
    </div>
  );
}
