"use client";

import { useState } from "react";

// Carte visuelle pour un exercice généré (au lieu d'une liste plate
// clé/valeur) : repères façon "readout" HUD, mise en page dense mais aérée.
// Pas de photo/vidéo hébergée (pas de bibliothèque maison — décision
// actée) : "Voir la technique" ouvre un aperçu vidéo intégré, en petit
// format, plutôt que de sortir vers un nouvel onglet YouTube (14/08/2026,
// demande explicite d'Anthony — l'ancien lien externe cassait
// l'expérience intégrée qu'il avait mise en place précédemment). Utilise
// le mode recherche intégrable de YouTube (`listType=search`), qui ne
// nécessite aucune clé API et fonctionne pour n'importe quel nom
// d'exercice généré par l'IA, sans bibliothèque à maintenir.
//
// Vignette vidéo + décomposition en 3 temps (20/08/2026, demande Anthony,
// référence : écran "Chaque exercice, guidé, expliqué" de Reboot Plan) :
// la photo devient elle-même le déclencheur (bouton lecture superposé),
// plus proche d'une vraie vignette vidéo qu'un petit bouton texte à côté.
// "phases" vient du prompt IA (programme-entrainement-session.ts) —
// absent sur les programmes générés avant ce changement, donc la section
// ne s'affiche que si le champ est présent, jamais un texte générique
// inventé côté client pour combler l'absence.
//
// Volontairement PAS de stat de progression ("Force globale ↑+8%") comme
// sur la référence Reboot Plan : SeanceLog.exercices est aujourd'hui du
// texte libre (un nom tapé à la main + charge), pas relié à l'identifiant
// exact d'un exercice généré — un vrai calcul de tendance par exercice
// afficherait des données vides pour la quasi-totalité des utilisateurs.
// À reprendre une fois le suivi de séance relié aux exercices du
// programme, pas avant.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const CHAMPS: { cle: string; label: string }[] = [
  { cle: "series", label: "Séries" },
  { cle: "repetitions", label: "Répétitions" },
  { cle: "repos", label: "Repos" },
  { cle: "charge", label: "Charge" },
  { cle: "methode", label: "Méthode" },
];

export function ExerciceCard({
  exercice,
  photosParExercice,
}: {
  exercice: unknown;
  // Photos Pexels (19/08/2026, demande Anthony) : résolues côté serveur
  // (pilier-page.tsx) à partir du "photoQuery" que l'IA génère pour CHAQUE
  // exercice — jamais d'appel réseau depuis ce composant client, jamais de
  // photo inventée (absente du map ou clé null → aucune image affichée).
  photosParExercice?: Record<string, string | null>;
}) {
  const [videoOuverte, setVideoOuverte] = useState(false);

  if (!isPlainObject(exercice)) return null;
  const nom = typeof exercice.nom === "string" ? exercice.nom : undefined;
  const photoQuery = typeof exercice.photoQuery === "string" ? exercice.photoQuery : undefined;
  const photoUrl = photoQuery ? photosParExercice?.[photoQuery] : null;
  const phases = Array.isArray(exercice.phases)
    ? exercice.phases.filter((p): p is string => typeof p === "string").slice(0, 3)
    : [];

  return (
    <div className="coai-exercise-card group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 pl-5 transition duration-300 hover:border-laiton-400/25 hover:bg-white/[0.035]">
      <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-laiton-400 via-laiton-500/70 to-transparent" />

      {photoUrl && nom && !videoOuverte && (
        <button
          type="button"
          onClick={() => setVideoOuverte(true)}
          aria-label={`Voir la technique : ${nom}`}
          className="group/thumb relative h-44 w-full overflow-hidden rounded-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- source Pexels externe, next/image nécessiterait de whitelister le domaine pour un usage encore expérimental */}
          <img src={photoUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover/thumb:scale-[1.03]" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" aria-hidden="true" />
          <span className="absolute left-3 top-3 rounded-full border border-white/25 bg-black/45 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
            Vidéo technique
          </span>
          <span
            className="absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/40 bg-black/40 text-white backdrop-blur-sm transition group-hover/thumb:scale-110 group-hover/thumb:bg-laiton-400/85 group-hover/thumb:border-laiton-300">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-6 w-6 fill-current"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </span>
        </button>
      )}

      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-graphite-50">{nom ?? "Exercice"}</h4>
        {nom && !photoUrl && (
          <button
            type="button"
            onClick={() => setVideoOuverte((v) => !v)}
            aria-expanded={videoOuverte}
            className="coai-technique-button shrink-0 whitespace-nowrap rounded-full border border-laiton-400/25 bg-laiton-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-laiton-300 transition hover:border-laiton-400/50 hover:bg-laiton-400/20"
          >
            {videoOuverte ? "✕ Fermer" : "▶ Technique"}
          </button>
        )}
        {nom && photoUrl && videoOuverte && (
          <button
            type="button"
            onClick={() => setVideoOuverte(false)}
            className="coai-technique-button shrink-0 whitespace-nowrap rounded-full border border-laiton-400/25 bg-laiton-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-laiton-300 transition hover:border-laiton-400/50 hover:bg-laiton-400/20"
          >
            ✕ Fermer la vidéo
          </button>
        )}
      </div>

      {videoOuverte && nom && (
        <div className="w-full overflow-hidden rounded-lg border border-white/[0.08] bg-black">
          <iframe
            src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(`${nom} technique musculation`)}`}
            title={`Aperçu technique : ${nom}`}
            className="aspect-video w-full"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}

      {phases.length === 3 && (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
          {phases.map((phase, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-2">
              <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-laiton-400/20 font-mono text-[9px] font-bold text-laiton-300">
                {i + 1}
              </span>
              <span className="text-[11px] leading-snug text-graphite-300">{phase}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {CHAMPS.map(({ cle, label }) => {
          const valeur = exercice[cle];
          if (valeur === undefined || valeur === null || valeur === "") return null;
          return (
            <div
              key={cle}
              className="coai-exercise-metric rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-2.5"
            >
              <span className="block font-mono text-[9px] uppercase tracking-widest text-graphite-500">
                {label}
              </span>
              <span className="mt-1 block text-xs font-semibold leading-snug text-graphite-50">
                {String(valeur)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
