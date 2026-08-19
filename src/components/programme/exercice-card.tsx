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

  return (
    <div className="coai-exercise-card group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 pl-5 transition duration-300 hover:border-laiton-400/25 hover:bg-white/[0.035]">
      <div className="absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-laiton-400 via-laiton-500/70 to-transparent" />
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- source Pexels externe, next/image nécessiterait de whitelister le domaine pour un usage encore expérimental
        <img
          src={photoUrl}
          alt=""
          className="h-32 w-full rounded-lg object-cover"
          loading="lazy"
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-graphite-50">{nom ?? "Exercice"}</h4>
        {nom && (
          <button
            type="button"
            onClick={() => setVideoOuverte((v) => !v)}
            aria-expanded={videoOuverte}
            className="coai-technique-button shrink-0 whitespace-nowrap rounded-full border border-laiton-400/25 bg-laiton-400/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-laiton-300 transition hover:border-laiton-400/50 hover:bg-laiton-400/20"
          >
            {videoOuverte ? "✕ Fermer" : "▶ Technique"}
          </button>
        )}
      </div>
      {videoOuverte && nom && (
        <div className="w-40 overflow-hidden rounded-lg border border-white/[0.08] bg-black">
          <iframe
            src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(`${nom} technique musculation`)}`}
            title={`Aperçu technique : ${nom}`}
            className="aspect-square w-full"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
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
