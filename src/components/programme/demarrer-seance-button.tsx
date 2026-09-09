"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SeanceRunner } from "@/components/programme/seance-runner";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

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
  const lecteurRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMonte(true), []);
  useEffect(() => {
    if (!ouvert || !monte) return;
    const precedentFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const lecteur = lecteurRef.current;
    if (!lecteur) return;
    const focusables = () => Array.from(lecteur.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]'
    )).filter(element => element.getClientRects().length > 0);
    (focusables()[0] ?? lecteur).focus();
    const garderFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const elements = focusables();
      const premier = elements[0];
      const dernier = elements[elements.length - 1];
      if (!premier || !dernier) { event.preventDefault(); lecteur.focus(); return; }
      const actif = document.activeElement;
      if (event.shiftKey && (actif === premier || actif === lecteur || !lecteur.contains(actif))) {
        event.preventDefault(); dernier.focus();
      } else if (!event.shiftKey && (actif === dernier || !lecteur.contains(actif))) {
        event.preventDefault(); premier.focus();
      }
    };
    document.addEventListener("keydown", garderFocus);
    const precedent = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = precedent;
      document.removeEventListener("keydown", garderFocus);
      if (precedentFocus?.isConnected) precedentFocus.focus();
    };
  }, [ouvert, monte]);

  if (!Array.isArray(exercices) || exercices.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOuvert(true);
          // Ouverture du lecteur, pas preuve de réalisation d'une séance.
          // Aucun nom d'exercice ni donnée de santé n'est envoyé à GA4.
          trackFunnelEvent("workout_player_opened");
        }}
        className="coai-rainbow-cta w-full rounded-xl border-0 py-3 text-sm font-extrabold text-[#111216]"
      >
        ▶ Démarrer la séance
      </button>
      {ouvert && monte && createPortal(
        <div ref={lecteurRef} tabIndex={-1}>
        <SeanceRunner
          nomSeance={nomSeance}
          echauffement={echauffement}
          exercices={exercices}
          retourAuCalme={retourAuCalme}
          photosParExercice={photosParExercice}
          onClose={() => setOuvert(false)}
        />
        </div>,
        document.body
      )}
    </>
  );
}
