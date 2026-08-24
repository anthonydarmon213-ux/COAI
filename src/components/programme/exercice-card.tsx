"use client";

import { useState } from "react";
import { MuscleMap } from "@/components/programme/muscle-map";
import { ExerciceAnimation } from "@/components/programme/exercice-animation";
import { animationPourExercice } from "@/lib/exercices/animations";
import { musclesPourExercice } from "@/lib/exercices/muscles";
import { variantesPourExercice, MATERIEL_LABEL, type Variante } from "@/lib/exercices/variantes";
import { photoCoaiPourNom } from "@/lib/exercices/photos-coai";
import { photoFiablePourNom } from "@/lib/exercices/photo-fiable";
import { videoCoaiPourNom } from "@/lib/exercices/videos-coai";

// Carte visuelle pour un exercice généré (au lieu d'une liste plate
// clé/valeur) : repères façon "readout" HUD, mise en page dense mais aérée.
// Pas de photo/vidéo hébergée (pas de bibliothèque maison — décision
// actée) : "Voir la technique" ouvre un aperçu vidéo intégré, en petit
// format, plutôt que de sortir vers un nouvel onglet YouTube (14/08/2026,
// demande explicite d'Anthony — l'ancien lien externe cassait
// l'expérience intégrée qu'il avait mise en place précédemment). Utilise
// Lien vers la recherche YouTube plutôt qu'un lecteur intégré
// (23/08/2026) : l'embed s'appuyait sur `listType=search`, que YouTube a
// déprécié le 15 novembre 2020 — il affichait "Cette vidéo n'est pas
// disponible" sur chaque exercice. Un lecteur réellement intégré
// exigerait un ID de vidéo par exercice (clé API YouTube ou table
// maintenue à la main) ; le lien ouvre une vraie démonstration tout de
// suite, sans dépendance ni contenu approximatif.
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

// Au-delà de cette longueur, une valeur n'est plus une métrique lisible en
// un coup d'œil mais une consigne : elle bascule dans le bloc dépliable
// sous la grille. Seuil sur la longueur réelle plutôt qu'une liste de
// champs figée — l'IA peut être concise sur "charge" pour un exercice au
// poids du corps ("poids du corps") et verbeuse sur "methode" ailleurs.
const LONGUEUR_METRIQUE_MAX = 42;

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
  // Substitution matériel (23/08/2026, demande Anthony) — purement locale :
  // remplacer l'exercice dans le programme enregistré demanderait de
  // régénérer la séance côté serveur. Ici la personne voit l'alternative
  // pour SA séance du jour, son programme reste celui validé.
  const [variantesOuvertes, setVariantesOuvertes] = useState(false);
  const [varianteChoisie, setVarianteChoisie] = useState<Variante | null>(null);

  if (!isPlainObject(exercice)) return null;
  const nom = typeof exercice.nom === "string" ? exercice.nom : undefined;
  const photoQuery = typeof exercice.photoQuery === "string" ? exercice.photoQuery : undefined;
  // Ordre de priorité (23/08/2026) : photo COAI tournée dans la charte,
  // puis Free Exercise DB (photo liée à l'exercice exact par un humain),
  // puis Pexels en dernier — la source qui donnait des photos fausses,
  // conservée seulement pour ne pas laisser une carte sans visuel.
  const photoUrl =
    (nom ? photoCoaiPourNom(nom) : null) ??
    (nom ? photoFiablePourNom(nom) : null) ??
    (photoQuery ? photosParExercice?.[photoQuery] ?? null : null);
  const videoUrl = nom ? videoCoaiPourNom(nom) : null;
  const cible = nom ? musclesPourExercice(nom) : null;
  const variantes = nom ? variantesPourExercice(nom) : [];
  const consignesLongues = CHAMPS.flatMap(({ cle, label }) => {
    const valeur = exercice[cle];
    if (valeur === undefined || valeur === null || valeur === "") return [];
    const texte = String(valeur);
    return texte.length > LONGUEUR_METRIQUE_MAX ? [{ label, texte }] : [];
  });
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

      {/* Double vue (23/08/2026, demande Anthony) — anatomie à gauche,
          repères d'exécution à droite. En colonne sur mobile : côte à côte
          sous 640px, le schéma deviendrait trop petit pour distinguer les
          faisceaux, ce qui est justement son intérêt.
          Chaque moitié ne s'affiche que si elle a du contenu réel : un
          mouvement non reconnu n'a pas de schéma (mieux vaut rien qu'un
          schéma qui éclaire les mauvais muscles), et tous les exercices
          générés n'ont pas encore de `phases`. */}
      {(cible || phases.length === 3) && (
        <div className={`grid gap-3 ${cible && phases.length === 3 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
          {cible && (
            <div className="coai-glass flex flex-col items-center justify-center px-3 py-4">
              <MuscleMap activeMuscles={cible.muscles} vue={cible.vue} compact />
            </div>
          )}

          {phases.length === 3 && (
            <div className="coai-glass flex flex-col gap-2.5 px-4 py-4">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-laiton-300">
                Exécution · étape par étape
              </p>
              {phases.map((phase, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border border-laiton-400/40 bg-laiton-400/10 font-mono text-[10px] font-bold text-laiton-200">
                    {i + 1}
                  </span>
                  <span className="text-[11px] leading-5 text-graphite-300">{phase}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {variantes.length > 0 && (
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
          <button
            type="button"
            onClick={() => setVariantesOuvertes((v) => !v)}
            aria-expanded={variantesOuvertes}
            className="flex w-full items-center justify-between gap-2 text-left"
          >
            <span className="text-[11px] font-semibold text-laiton-200">
              ⚡️ Pas le matériel ? Changer d&apos;exercice
            </span>
            <span aria-hidden="true" className="text-graphite-500">{variantesOuvertes ? "✕" : "▾"}</span>
          </button>

          {variantesOuvertes && (
            <div className="mt-2.5 flex flex-col gap-1.5">
              {variantes.map((v) => (
                <button
                  key={v.nom}
                  type="button"
                  onClick={() => {
                    setVarianteChoisie(varianteChoisie?.nom === v.nom ? null : v);
                    setVariantesOuvertes(false);
                  }}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    varianteChoisie?.nom === v.nom
                      ? "border-laiton-400/50 bg-laiton-400/10"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-laiton-300">
                    {MATERIEL_LABEL[v.materiel]}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-graphite-50">{v.nom}</span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-graphite-400">{v.consigne}</span>
                </button>
              ))}
            </div>
          )}

          {varianteChoisie && !variantesOuvertes && (
            <div className="mt-2.5 rounded-lg border border-laiton-400/35 bg-laiton-400/[0.08] px-3 py-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-laiton-300">
                Tu fais à la place · {MATERIEL_LABEL[varianteChoisie.materiel]}
              </span>
              <span className="mt-0.5 block text-xs font-semibold text-[#fffdf8]">{varianteChoisie.nom}</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-graphite-300">{varianteChoisie.consigne}</span>
              <button
                type="button"
                onClick={() => setVarianteChoisie(null)}
                className="mt-1.5 text-[10px] text-graphite-500 underline"
              >
                Revenir à {nom}
              </button>
            </div>
          )}
        </div>
      )}

      {videoOuverte && nom && videoUrl && (
        <div className="w-full overflow-hidden rounded-lg border border-white/[0.08]">
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="h-auto w-full"
          />
        </div>
      )}

      {videoOuverte && nom && !videoUrl && animationPourExercice(nom) && (
        <ExerciceAnimation nom={nom} className="w-full" />
      )}

      {videoOuverte && nom && !videoUrl && !animationPourExercice(nom) && (
        <div className="w-full rounded-lg border border-white/[0.08] bg-black/30 p-4 text-center">
          <p className="text-xs leading-5 text-graphite-300">
            Voir une démonstration de <span className="font-semibold text-white">{nom}</span> sur YouTube.
          </p>
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${nom} technique musculation`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-laiton-400/35 bg-laiton-400/10 px-4 py-2 text-xs font-semibold text-laiton-200 transition hover:bg-laiton-400/20"
          >
            ▶ Ouvrir la démonstration
          </a>
        </div>
      )}

      {/* Les phases d'exécution étaient rendues ici ET dans la double vue
          ci-dessus depuis l'ajout de cette dernière (23/08/2026) : bloc
          retiré, la double vue est le seul emplacement. */}

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {CHAMPS.map(({ cle, label }) => {
          const valeur = exercice[cle];
          if (valeur === undefined || valeur === null || valeur === "") return null;
          const texte = String(valeur);
          // Les repères de charge générés par l'IA sont des phrases
          // entières ("charge permettant de sentir les 2 dernières
          // répétitions difficiles…"), pas des valeurs courtes comme les
          // séries ou le repos. Tassées dans une case de métrique, elles
          // produisaient le pavé illisible signalé par Anthony
          // (23/08/2026) : rendues en consigne dépliable sous la grille.
          if (texte.length > LONGUEUR_METRIQUE_MAX) return null;
          return (
            <div
              key={cle}
              className="coai-exercise-metric rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-2.5"
            >
              <span className="block font-mono text-[9px] uppercase tracking-widest text-graphite-500">
                {label}
              </span>
              <span className="mt-1 block text-xs font-semibold leading-snug text-graphite-50">
                {texte}
              </span>
            </div>
          );
        })}
      </div>

      {consignesLongues.length > 0 && (
        <details className="group/consigne rounded-lg border border-white/[0.07] bg-black/20">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 marker:content-none">
            <span className="text-[11px] font-semibold text-laiton-200">💡 Consigne du coach</span>
            <span aria-hidden="true" className="text-graphite-500 transition group-open/consigne:rotate-180">▾</span>
          </summary>
          <div className="flex flex-col gap-2 border-t border-white/[0.06] px-3 py-2.5">
            {consignesLongues.map(({ label, texte }) => (
              <div key={label}>
                <span className="block font-mono text-[9px] uppercase tracking-widest text-graphite-500">{label}</span>
                <span className="mt-0.5 block text-[11px] leading-5 text-graphite-300">{texte}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
