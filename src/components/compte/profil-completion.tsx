export function ProfilCompletion({ remplis, total }: { remplis: number; total: number }) {
  const pourcentage = Math.round((remplis / total) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-graphite-400">
          Profil complété
        </span>
        <span className="font-mono text-xs text-graphite-300">
          {remplis}/{total} champs · {pourcentage}%
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-graphite-800">
        <div
          className="h-full rounded-full bg-laiton-400 transition-all"
          style={{ width: `${pourcentage}%` }}
        />
      </div>
      {pourcentage < 100 && (
        <p className="text-xs text-graphite-400">
          Plus ton profil est complet, plus le programme généré par l&apos;IA sera précis.
        </p>
      )}
    </div>
  );
}
