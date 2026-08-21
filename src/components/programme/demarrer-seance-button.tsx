"use client";

import { useState } from "react";
import { SeanceRunner } from "@/components/programme/seance-runner";

// Bouton client isolé (21/08/2026) : entrainement-view.tsx reste un
// composant serveur, seul ce déclencheur + le lecteur plein écran ont
// besoin d'état côté client — évite de convertir toute la vue.
export function DemarrerSeanceButton({
  nomSeance,
  echauffement,
  exercices,
  retourAuCalme,
  photosParExercice,
}: {
  nomSeance: string;
  echauffement?: string;
  exercices: unknown[];
  retourAuCalme?: string;
  photosParExercice?: Record<string, string | null>;
}) {
  const [ouvert, setOuvert] = useState(false);

  if (!Array.isArray(exercices) || exercices.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="coai-rainbow-cta w-full rounded-xl border-0 py-3 text-sm font-extrabold text-[#111216]"
      >
        ▶ Démarrer la séance
      </button>
      {ouvert && (
        <SeanceRunner
          nomSeance={nomSeance}
          echauffement={echauffement}
          exercices={exercices}
          retourAuCalme={retourAuCalme}
          photosParExercice={photosParExercice}
          onClose={() => setOuvert(false)}
        />
      )}
    </>
  );
}
