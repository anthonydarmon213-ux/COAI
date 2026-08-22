"use client";

import { useState } from "react";

// Desk Reset 3 min (22/08/2026, demande Anthony) — routine de mobilité
// pour quelqu'un assis depuis des heures. AUCUN appel LLM : la routine est
// tirée d'une liste fixe côté client, ce qui la rend instantanée et
// gratuite. Un modèle n'apporterait rien ici, les mouvements de mobilité de
// bureau sont standards et n'ont pas besoin d'être "personnalisés".
//
// Les mouvements sont volontairement sans matériel, sans se mettre au sol
// et sans transpirer : utilisables entre deux réunions, en tenue de
// travail — c'est exactement la contrainte de la cible COAI (dirigeants,
// agenda saturé).

type Mouvement = { nom: string; duree: number; consigne: string; emoji: string };

const ROUTINES: Mouvement[][] = [
  [
    { nom: "Ouverture de poitrine", duree: 45, emoji: "🫁", consigne: "Mains croisées derrière la tête, ouvre les coudes vers l'arrière. Respire lentement, sans forcer le bas du dos." },
    { nom: "Rotations de nuque", duree: 45, emoji: "🧣", consigne: "Oreille vers l'épaule, lentement, d'un côté puis de l'autre. Jamais de rotation complète ni de mouvement brusque." },
    { nom: "Extension debout", duree: 60, emoji: "🙆", consigne: "Debout, mains sur les reins, ouvre légèrement vers l'arrière. Amplitude courte : on décomprime, on ne cambre pas." },
  ],
  [
    { nom: "Étirement des hanches", duree: 60, emoji: "🦵", consigne: "Un pied posé sur la chaise, bassin qui avance doucement. Change de côté à mi-temps." },
    { nom: "Rotation du buste", duree: 45, emoji: "🌀", consigne: "Assis, mains croisées, tourne le buste d'un côté puis de l'autre. Le bassin reste fixe." },
    { nom: "Épaules en cercle", duree: 45, emoji: "🔄", consigne: "Grands cercles d'épaules vers l'arrière, lentement. Relâche la mâchoire en même temps." },
  ],
  [
    { nom: "Étirement des poignets", duree: 45, emoji: "✋", consigne: "Bras tendu, tire les doigts vers toi puis vers le bas. Essentiel après des heures de clavier." },
    { nom: "Fente basse contre le bureau", duree: 60, emoji: "🧎", consigne: "Un grand pas en arrière, mains en appui sur le bureau. Le devant de la hanche arrière s'ouvre." },
    { nom: "Respiration 4-6", duree: 45, emoji: "🌬️", consigne: "Inspire 4 secondes, expire 6 secondes. C'est l'expiration longue qui fait redescendre la tension." },
  ],
];

function formatDuree(secondes: number): string {
  return `${secondes}s`;
}

export function DeskResetCard() {
  const [ouvert, setOuvert] = useState(false);
  // Routine tirée au lancement : deux jours d'affilée ne donnent pas la
  // même, sans avoir à stocker quoi que ce soit.
  const [routine, setRoutine] = useState<Mouvement[]>(() => ROUTINES[0]!);

  function lancer() {
    setRoutine(ROUTINES[Math.floor(Math.random() * ROUTINES.length)]!);
    setOuvert(true);
  }

  const total = routine.reduce((somme, m) => somme + m.duree, 0);

  return (
    <section className="coai-glass p-5">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">Pause active</p>
      <h2 className="mt-1.5 text-lg font-semibold text-white">💼 Desk Reset · 3 min</h2>
      <p className="mt-1 text-xs leading-5 text-graphite-400">
        Trois mouvements sans matériel, debout ou assis — entre deux réunions, sans transpirer.
      </p>

      {!ouvert ? (
        <button
          type="button"
          onClick={lancer}
          className="mt-3 w-full rounded-full border border-laiton-400/35 bg-laiton-400/10 py-2.5 text-xs font-semibold text-laiton-200 transition hover:bg-laiton-400/20"
        >
          Lancer ma pause →
        </button>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {routine.map((m, i) => (
            <div key={m.nom} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3">
              <span aria-hidden="true" className="mt-0.5 text-lg">{m.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-white">
                    <span className="mr-1.5 font-mono text-[10px] text-laiton-300">{i + 1}</span>
                    {m.nom}
                  </p>
                  <span className="flex-none font-mono text-[10px] tabular-nums text-graphite-500">{formatDuree(m.duree)}</span>
                </div>
                <p className="mt-1 text-xs leading-5 text-graphite-400">{m.consigne}</p>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="font-mono text-[10px] text-graphite-500">Total ~{Math.round(total / 60)} min</span>
            <button
              type="button"
              onClick={lancer}
              className="rounded-full border border-white/15 px-3.5 py-1.5 text-[11px] font-semibold text-graphite-300 transition hover:text-white"
            >
              Une autre routine
            </button>
          </div>

          <p className="text-[10px] leading-4 text-graphite-500">
            Mouvements de mobilité générale. Arrête-toi si l&apos;un d&apos;eux réveille une douleur.
          </p>
        </div>
      )}
    </section>
  );
}
