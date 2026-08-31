import { ProgrammesPretsGrid } from "@/components/programme/programmes-prets-grid";
import { PROGRAMMES_PRETS } from "@/lib/programmes-prets/catalogue";
import { getCurrentAppUser } from "@/lib/auth/server";

export default async function ProgrammesPretsPage() {
  const user = await getCurrentAppUser();
  const sexe = user?.profile?.sexe;
  const photoLocale = (programme: (typeof PROGRAMMES_PRETS)[number]) =>
    sexe === "Homme"
      ? (programme.photoHomme ?? programme.photoFemme)
      : (programme.photoFemme ?? programme.photoHomme);
  const items = PROGRAMMES_PRETS.map((programme) => ({
    programme,
    photoUrl: photoLocale(programme) ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Bibliothèque</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Programmes prêts à l&apos;emploi.</h1>
        <p className="max-w-2xl text-base leading-7 text-graphite-300">
          Une sélection de programmes ciblés — mobilité, bureau, préparation de course, perte de poids,
          poids du corps, fessiers, challenge 30 jours — indépendante de ton programme
          personnalisé généré par IA. À suivre en plus, jamais à la place.
        </p>
      </div>
      <ProgrammesPretsGrid items={items} sexe={sexe} />
    </div>
  );
}
