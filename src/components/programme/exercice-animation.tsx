"use client";

import { animationPourExercice, urlAnimation } from "@/lib/exercices/animations";

// Boucle animée d'un exercice (23/08/2026, demande Anthony) — remplace le
// renvoi vers YouTube quand un clip existe pour ce mouvement.
//
// Point important sur l'autoplay : contrairement à la vidéo de la landing
// (qui restait noire à cause de preload="none"), on charge ici les
// métadonnées. Les clips pèsent 30 à 70 Ko, le coût est négligeable et
// c'est ce qui permet à la boucle de démarrer réellement.
//
// muted + playsInline sont indispensables : sans eux, iOS et Chrome
// refusent l'autoplay et affichent un cadre figé.
export function ExerciceAnimation({
  nom,
  className = "",
}: {
  nom: string;
  className?: string;
}) {
  const animation = animationPourExercice(nom);
  if (!animation) return null;

  return (
    <figure className={`overflow-hidden rounded-xl border border-laiton-400/20 bg-[#0D0E12] ${className}`}>
      <video
        className="h-full w-full object-cover"
        src={urlAnimation(animation.fichier)}
        preload="metadata"
        autoPlay
        muted
        loop
        playsInline
        aria-label={`Démonstration : ${animation.description}`}
      />
      <figcaption className="px-3 py-2 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-graphite-500">
        {animation.description}
      </figcaption>
    </figure>
  );
}
