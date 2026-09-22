"use client";

import { useAnimatedNumber } from "@/components/ui/use-animated-number";
import type { CompletionProfil } from "@/lib/profil/completion";

// Barre animée (14/08/2026, demande Anthony — "il faut motiver la personne
// en chemin", "un effet ouahh") : le pourcentage compte de 0 jusqu'à sa
// vraie valeur côté client. Le palier complet reçoit une pulsation unique
// en CSS, sans minuteur, uniquement si les animations sont autorisées.
export function ProfilCompletion({ completion }: { completion: CompletionProfil }) {
  const { pourcentage, essentielComplet, champsEssentielsManquants } = completion;
  const displayed = useAnimatedNumber(pourcentage, 900);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-graphite-400">
          COAI te connaît à {displayed}%
        </span>
        <span className="font-mono text-xs text-graphite-300">
          {completion.remplis}/{completion.total} champs
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-graphite-800">
        <div
          className="h-full rounded-full bg-laiton-400"
          style={{ width: `${displayed}%` }}
        />
      </div>
      {essentielComplet ? (
        <p key="complete" className="text-xs text-laiton-300 motion-safe:animate-[pulse_1.4s_ease-in-out_1]">
          Profil suffisamment précis pour générer ton programme — le reste affine encore la
          précision.
        </p>
      ) : (
        <p key="incomplete" className="text-xs text-graphite-400">
          Il manque encore : {champsEssentielsManquants.join(", ")} — nécessaires pour générer un
          programme sûr et pertinent.
        </p>
      )}
    </div>
  );
}
