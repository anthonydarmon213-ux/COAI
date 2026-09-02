"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  comparerAvantApres,
  historiquePourExercice,
  type PerfExercice,
  type SetSaisi,
} from "@/lib/suivi/historique-exercice";

const REPOS_DEFAUT = 90;

function formatDate(d: Date) {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function RepCount({ exercices }: { exercices: string[] }) {
  const [nom, setNom] = useState("");
  const [reps, setReps] = useState(10);
  const [charge, setCharge] = useState(20);
  const [sets, setSets] = useState<SetSaisi[]>([]);
  const [seances, setSeances] = useState<{ date: string; exercices: unknown }[]>([]);
  const [repos, setRepos] = useState<number | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const charger = useCallback(async () => {
    const r = await fetch("/api/seances");
    if (r.ok) setSeances(await r.json());
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  // Minuteur de repos : décrémente jusqu'à zéro puis s'arrête de lui-même.
  useEffect(() => {
    if (repos === null) return;
    if (repos <= 0) {
      setRepos(null);
      return;
    }
    timerRef.current = window.setTimeout(() => setRepos((r) => (r === null ? null : r - 1)), 1000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [repos]);

  const historique = useMemo(
    () => (nom.trim() ? historiquePourExercice(seances, nom) : []),
    [seances, nom]
  );
  const comparaison = useMemo(() => comparerAvantApres(historique), [historique]);

  const volumeCourant = sets.reduce((t, s) => t + s.reps * s.charge, 0);

  const ajouterSerie = useCallback(() => {
    setSets((s) => [...s, { reps, charge }]);
    setRepos(REPOS_DEFAUT);
    setEnregistre(false);
  }, [reps, charge]);

  const enregistrer = useCallback(async () => {
    if (!nom.trim() || sets.length === 0) return;
    setErreur(null);
    const r = await fetch("/api/seances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toISOString(),
        exercices: [
          {
            nom: nom.trim(),
            sets: sets.map((s, i) => ({ set: i + 1, reps: s.reps, charge: s.charge })),
          },
        ],
      }),
    });
    if (!r.ok) {
      setErreur("L'enregistrement a échoué. Réessaie.");
      return;
    }
    setSets([]);
    setEnregistre(true);
    void charger();
  }, [nom, sets, charger]);

  const Stepper = ({
    label,
    valeur,
    setValeur,
    pas,
    unite,
  }: {
    label: string;
    valeur: number;
    setValeur: (v: number) => void;
    pas: number;
    unite: string;
  }) => (
    <div className="flex-1">
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-400">
        {label}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setValeur(Math.max(0, +(valeur - pas).toFixed(1)))}
          aria-label={`Diminuer ${label}`}
          className="h-12 w-12 shrink-0 rounded-xl border border-white/12 bg-white/[0.04] text-xl font-bold text-white active:bg-white/10"
        >
          −
        </button>
        <span className="flex-1 text-center font-display text-3xl font-semibold tabular-nums text-white">
          {valeur}
          <span className="ml-1 text-sm font-normal text-graphite-400">{unite}</span>
        </span>
        <button
          type="button"
          onClick={() => setValeur(+(valeur + pas).toFixed(1))}
          aria-label={`Augmenter ${label}`}
          className="h-12 w-12 shrink-0 rounded-xl border border-white/12 bg-white/[0.04] text-xl font-bold text-white active:bg-white/10"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label htmlFor="repcount-exercice" className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-200">
          Exercice
        </label>
        <input
          id="repcount-exercice"
          list="repcount-liste"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Développé couché, squat…"
          className="mt-1.5 w-full rounded-xl border border-white/12 bg-black/40 px-4 py-3.5 text-base text-white placeholder:text-graphite-500"
        />
        <datalist id="repcount-liste">
          {exercices.map((e) => (
            <option key={e} value={e} />
          ))}
        </datalist>
      </div>

      {/* La performance précédente est affichée avant la saisie : c'est elle
          qui donne l'objectif du jour, pas un chiffre consulté après coup. */}
      {comparaison.precedente && (
        <div className="rounded-xl border border-laiton-300/25 bg-laiton-300/[0.06] px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-200">
            Dernière fois · {formatDate(comparaison.precedente.date)}
          </p>
          <p className="mt-1.5 text-sm text-white">
            {comparaison.precedente.sets
              .map((s) => `${s.reps}×${s.charge}kg`)
              .join("  ·  ")}
          </p>
          <p className="mt-1 text-xs text-graphite-400">
            Volume {Math.round(comparaison.precedente.volume)} kg
            {comparaison.deltaVolume !== null && (
              <span className={comparaison.deltaVolume >= 0 ? "text-emerald-300" : "text-amber-300"}>
                {" "}· {comparaison.deltaVolume >= 0 ? "+" : ""}
                {Math.round(comparaison.deltaVolume)} kg vs la semaine passée
              </span>
            )}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Stepper label="Répétitions" valeur={reps} setValeur={setReps} pas={1} unite="" />
        <Stepper label="Charge" valeur={charge} setValeur={setCharge} pas={2.5} unite="kg" />
      </div>

      <button
        type="button"
        onClick={ajouterSerie}
        disabled={!nom.trim()}
        className="rounded-full bg-cyan-300 py-4 text-base font-bold text-[#04121a] transition disabled:opacity-40"
      >
        Valider la série
      </button>

      {repos !== null && (
        <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/[0.06] px-4 py-3 text-center" role="status">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-200">Repos</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-white">
            {Math.floor(repos / 60)}:{String(repos % 60).padStart(2, "0")}
          </p>
          <button
            type="button"
            onClick={() => setRepos(null)}
            className="mt-1 text-xs text-graphite-400 underline"
          >
            Passer
          </button>
        </div>
      )}

      {sets.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-400">
            {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} · volume{" "}
            {Math.round(volumeCourant)} kg
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {sets.map((s, i) => (
              <li key={i} className="flex items-center justify-between text-sm text-white">
                <span>
                  Série {i + 1} — {s.reps} × {s.charge} kg
                </span>
                <button
                  type="button"
                  onClick={() => setSets((liste) => liste.filter((_, j) => j !== i))}
                  className="text-xs text-graphite-400 underline"
                >
                  retirer
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={enregistrer}
            className="mt-4 w-full rounded-full border border-laiton-300/40 bg-laiton-300/10 py-3 text-sm font-bold text-laiton-200"
          >
            Enregistrer l&apos;exercice
          </button>
        </div>
      )}

      {erreur && <p className="text-sm text-rose-300">{erreur}</p>}
      {enregistre && (
        <p className="text-sm text-emerald-300">
          Enregistré. Ça alimente ta progression et ton volume par muscle.
        </p>
      )}

      {historique.length > 1 && (
        <details className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-white">
            Historique de cet exercice ({historique.length})
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {historique.slice(0, 10).map((perf: PerfExercice, i) => (
              <li key={i} className="flex items-center justify-between text-xs text-graphite-300">
                <span>{formatDate(perf.date)}</span>
                <span className="text-white">{perf.sets.map((s) => `${s.reps}×${s.charge}`).join(" · ")}</span>
                <span className="tabular-nums text-graphite-400">{Math.round(perf.volume)} kg</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
