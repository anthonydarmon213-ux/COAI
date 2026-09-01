"use client";

import { useEffect, useRef, useState } from "react";
import { Flame, Repeat, Timer, TrendingUp } from "lucide-react";

// Écran de fin de séance (01/09/2026, demande Anthony — « marquer les
// esprits »). L'ancien écran affichait une coche et un chrono : le moment le
// plus fort de l'app, celui où l'utilisateur vient de finir son effort, ne
// lui renvoyait rien de ce qu'il venait d'accomplir.
//
// Le chiffre mis en scène est le TONNAGE (somme des répétitions × charge) :
// c'est le seul indicateur qui grossit visiblement de séance en séance, donc
// le seul qui donne envie de revenir. La comparaison avec la séance
// précédente n'apparaît que si elle existe — jamais de « +0 % » au premier
// entraînement, qui donnerait le sentiment de n'avoir rien fait.

export type BilanExercice = { nom: string; series: number; sets: { reps: number; charge: number }[] };

function useCompteur(cible: number, actif: boolean, duree = 1100) {
  const [valeur, setValeur] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!actif) return;
    // prefers-reduced-motion : on affiche directement le résultat.
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setValeur(cible);
      return;
    }
    const debut = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - debut) / duree);
      // easing sortant : le chiffre ralentit en arrivant, ça se lit mieux.
      setValeur(Math.round(cible * (1 - Math.pow(1 - p, 3))));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [cible, actif, duree]);
  return valeur;
}

function Tuile({ icone: Icone, valeur, libelle }: { icone: typeof Flame; valeur: string; libelle: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-center">
      <Icone size={15} className="mx-auto text-graphite-300" aria-hidden="true" />
      <p className="mt-1 font-display text-lg font-bold text-[#fffdf8]">{valeur}</p>
      <p className="text-[10px] uppercase tracking-wide text-graphite-400">{libelle}</p>
    </div>
  );
}

export function SeanceBilan({
  exercices,
  dureeSecondes,
  tonnagePrecedent,
  onFermer,
  chronoFormate,
}: {
  exercices: BilanExercice[];
  dureeSecondes: number;
  tonnagePrecedent: number | null;
  onFermer: () => void;
  chronoFormate: string;
}) {
  const tonnage = exercices.reduce(
    (t, e) => t + e.sets.reduce((s, x) => s + x.reps * x.charge, 0), 0);
  const series = exercices.reduce((n, e) => n + e.series, 0);
  const repetitions = exercices.reduce((n, e) => n + e.sets.reduce((s, x) => s + x.reps, 0), 0);

  const affiche = useCompteur(tonnage, true);
  const ecart = tonnagePrecedent && tonnagePrecedent > 0
    ? Math.round(((tonnage - tonnagePrecedent) / tonnagePrecedent) * 100)
    : null;

  return (
    <div className="coai-bilan flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-10 text-center">
      <div className="coai-bilan-anneau" aria-hidden="true" />

      <div className="relative">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-laiton-300">
          Séance terminée
        </p>
        {tonnage > 0 ? (
          <>
            <p className="mt-3 font-display text-6xl font-extrabold tabular-nums text-[#fffdf8] sm:text-7xl">
              {affiche.toLocaleString("fr-FR")}
              <span className="ml-2 text-2xl text-graphite-400">kg</span>
            </p>
            <p className="mt-1 text-sm text-graphite-300">soulevés aujourd&apos;hui</p>
            {ecart !== null && ecart !== 0 && (
              <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                ecart > 0 ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
                          : "border-white/15 bg-white/[0.05] text-graphite-300"}`}>
                <TrendingUp size={13} aria-hidden="true" />
                {ecart > 0 ? `+${ecart}% par rapport à ta dernière séance` : `${ecart}% par rapport à ta dernière séance`}
              </p>
            )}
          </>
        ) : (
          <p className="mt-3 font-display text-3xl font-bold text-[#fffdf8]">
            C&apos;est fait.
          </p>
        )}
      </div>

      <div className="grid w-full max-w-sm grid-cols-3 gap-2.5">
        <Tuile icone={Timer} valeur={chronoFormate} libelle="Durée" />
        <Tuile icone={Repeat} valeur={String(series)} libelle="Séries" />
        <Tuile icone={Flame} valeur={String(repetitions)} libelle="Répétitions" />
      </div>

      {exercices.length > 0 && (
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left">
          {exercices.map((e) => {
            const t = e.sets.reduce((s, x) => s + x.reps * x.charge, 0);
            return (
              <div key={e.nom} className="flex items-baseline justify-between gap-3 py-1.5 text-xs">
                <span className="min-w-0 truncate text-graphite-200">{e.nom}</span>
                <span className="flex-none font-mono tabular-nums text-graphite-400">
                  {e.series} × {t > 0 ? `${t.toLocaleString("fr-FR")} kg` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onFermer}
        className="coai-rainbow-cta rounded-full border-0 px-8 py-3 text-sm font-bold text-[#111216]"
      >
        Terminer
      </button>
      <p className="text-[11px] text-graphite-400">
        {dureeSecondes > 0 ? "Ta séance est enregistrée dans ton suivi." : ""}
      </p>
    </div>
  );
}
