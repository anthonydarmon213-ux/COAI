import type { CompletionProfil } from "@/lib/profil/completion";

export function ProfilCompletion({ completion }: { completion: CompletionProfil }) {
  const { pourcentage, essentielComplet, champsEssentielsManquants } = completion;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-graphite-400">
          COAI te connaît à {pourcentage}%
        </span>
        <span className="font-mono text-xs text-graphite-300">
          {completion.remplis}/{completion.total} champs
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-graphite-800">
        <div
          className="h-full rounded-full bg-laiton-400 transition-all"
          style={{ width: `${pourcentage}%` }}
        />
      </div>
      {essentielComplet ? (
        <p className="text-xs text-laiton-300">
          Profil suffisamment précis pour générer ton programme — le reste affine encore la
          précision.
        </p>
      ) : (
        <p className="text-xs text-graphite-400">
          Il manque encore : {champsEssentielsManquants.join(", ")} — nécessaires pour générer un
          programme sûr et pertinent.
        </p>
      )}
    </div>
  );
}
