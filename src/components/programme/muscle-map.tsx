"use client";

import Body from "react-muscle-highlighter";
import { MUSCLE_LABEL, type MuscleSlug } from "@/lib/exercices/muscles";

// Cartographie anatomique (22/08/2026, demande Anthony) — s'appuie sur
// react-muscle-highlighter (MIT), dont les slugs de muscles sont ceux
// utilisés dans src/lib/exercices/muscles.ts : aucune traduction
// intermédiaire, donc aucun risque de décalage entre l'exercice et le
// schéma allumé.
//
// Enveloppé dans ce composant plutôt qu'appelé directement dans le lecteur :
// le jour où l'asset graphique HD remplacera la librairie, seul ce fichier
// change, le Live Player n'y touche pas.
const OR = "#D4AF37";
const FOND = "#0D0E12";
const CONTOUR = "#2A2D35";

export function MuscleMap({
  activeMuscles,
  vue = "front",
  compact = false,
  intensites,
  echelle,
  sansLegende = false,
}: {
  activeMuscles: MuscleSlug[];
  vue?: "front" | "back";
  compact?: boolean;
  // Intensité par muscle (0 à 1) : sert la synthèse 30 jours, où la teinte
  // traduit le volume réellement travaillé sur chaque zone. Sans elle, tous
  // les muscles sont pleins — le comportement d'origine sur une fiche
  // d'exercice, où la notion de volume n'a pas de sens.
  intensites?: Partial<Record<MuscleSlug, number>>;
  echelle?: number;
  sansLegende?: boolean;
}) {
  if (activeMuscles.length === 0) return null;

  const data = activeMuscles.map((slug) => ({
    slug,
    intensity: intensites ? Math.max(0.12, Math.min(1, intensites[slug] ?? 0)) : 1,
  }));
  const libelles = activeMuscles.map((m) => MUSCLE_LABEL[m]).filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* La lueur dorée est portée par un filtre CSS sur le conteneur : la
          librairie ne connaît pas nos effets, et surcharger son SVG de
          l'extérieur casserait à chaque mise à jour du paquet. */}
      <div
        className="coai-muscle-map"
        style={{ filter: `drop-shadow(0 0 6px ${OR}66) drop-shadow(0 0 14px ${OR}33)` }}
      >
        <Body
          data={data}
          side={vue}
          gender="male"
          scale={echelle ?? (compact ? 0.62 : 0.85)}
          colors={[OR]}
          defaultFill={FOND}
          defaultStroke={CONTOUR}
          defaultStrokeWidth={1}
          border="none"
        />
      </div>

      {!sansLegende && libelles.length > 0 && (
        <p className="text-center font-mono text-[10px] font-bold uppercase tracking-[0.16em]">
          <span className="text-graphite-500">Target : </span>
          <span style={{ color: OR }}>{libelles.join(" · ")}</span>
        </p>
      )}
    </div>
  );
}
