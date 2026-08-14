"use client";

import { useEffect, useRef, useState } from "react";
import type { CompletionProfil } from "@/lib/profil/completion";

// Barre animée (14/08/2026, demande Anthony — "il faut motiver la personne
// en chemin", "un effet ouahh") : le pourcentage compte de 0 jusqu'à sa
// vraie valeur au montage plutôt que de s'afficher figé, et un flash doré
// marque le moment où le profil bascule de "incomplet" à "suffisant pour
// générer" — un vrai palier franchi, pas un texte qui change en silence.
export function ProfilCompletion({ completion }: { completion: CompletionProfil }) {
  const { pourcentage, essentielComplet, champsEssentielsManquants } = completion;
  const [displayed, setDisplayed] = useState(0);
  const [flash, setFlash] = useState(false);
  const previousComplet = useRef(essentielComplet);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setDisplayed(pourcentage);
      return;
    }
    const duration = 900;
    const start = performance.now();
    let frame: number;
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      setDisplayed(Math.round(pourcentage * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // pourcentage seul en dépendance : rejoue le compteur si la valeur change
    // (ex: après enregistrement), pas à chaque re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pourcentage]);

  useEffect(() => {
    if (essentielComplet && !previousComplet.current) {
      setFlash(true);
      const timeout = setTimeout(() => setFlash(false), 1400);
      previousComplet.current = essentielComplet;
      return () => clearTimeout(timeout);
    }
    previousComplet.current = essentielComplet;
  }, [essentielComplet]);

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
        {flash && (
          <span
            className="animate-pulse-glow pointer-events-none absolute inset-0 -z-10 rounded-full bg-laiton-400 blur-md"
            aria-hidden="true"
          />
        )}
        <div
          className="h-full rounded-full bg-laiton-400 transition-all duration-300 ease-out"
          style={{ width: `${displayed}%` }}
        />
      </div>
      {essentielComplet ? (
        <p className={`text-xs text-laiton-300 ${flash ? "animate-pulse-glow" : ""}`}>
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
