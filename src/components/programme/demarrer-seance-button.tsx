"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  const [monte, setMonte] = useState(false);

  useEffect(() => setMonte(true), []);
  useEffect(() => {
    if (!ouvert) return;
    const precedent = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = precedent;
    };
  }, [ouvert]);

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
      {ouvert && monte && createPortal(
        <SeanceRunner
          nomSeance={nomSeance}
          echauffement={echauffement}
          exercices={exercices}
          retourAuCalme={retourAuCalme}
          photosParExercice={photosParExercice}
          onClose={() => setOuvert(false)}
        />,
        document.body
      )}
    </>
  );
}
