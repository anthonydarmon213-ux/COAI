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

function meilleureCharge(perf: PerfExercice): number {
  return Math.max(0, ...perf.sets.map((serie) => serie.charge));
}

function totalRepetitions(perf: PerfExercice): number {
  return perf.sets.reduce((total, serie) => total + serie.reps, 0);
}

function CourbeProgression({ historique }: { historique: PerfExercice[] }) {
  const chronologie = historique.slice(0, 10).reverse();
  const suitLaCharge = chronologie.some((perf) => meilleureCharge(perf) > 0);
  const valeurs = chronologie.map((perf) =>
    suitLaCharge ? meilleureCharge(perf) : totalRepetitions(perf)
  );
  const minimum = Math.min(...valeurs);
  const maximum = Math.max(...valeurs);
  const amplitude = Math.max(maximum - minimum, 1);
  const largeur = 640;
  const hauteur = 230;
  const margeX = 34;
  const haut = 30;
  const bas = 184;
  const points = valeurs.map((valeur, index) => ({
    x:
      chronologie.length === 1
        ? largeur / 2
        : margeX + (index / (chronologie.length - 1)) * (largeur - margeX * 2),
    y: bas - ((valeur - minimum) / amplitude) * (bas - haut),
    valeur,
  }));
  const premierPoint = points[0]!;
  const derniere = points.at(-1)!;
  const premierePerf = chronologie[0]!;
  const dernierePerf = chronologie.at(-1)!;
  const trace = points.map((point) => `${point.x},${point.y}`).join(" ");
  const zone = `${premierPoint.x},${bas} ${trace} ${derniere.x},${bas}`;
  const valeurPrecedente = valeurs.at(-2) ?? null;
  const progression = valeurPrecedente === null ? null : derniere.valeur - valeurPrecedente;
  const record = Math.max(...valeurs);
  const estRecord = derniere.valeur >= record;
  const unite = suitLaCharge ? "kg" : "reps";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-300/25 bg-[#06131b] p-4 shadow-[0_0_45px_rgba(34,211,238,0.08)]">
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-laiton-300/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200">
            Progression RepCount
          </p>
          <p className="mt-1 text-sm text-graphite-300">
            {suitLaCharge ? "Meilleure charge par séance" : "Répétitions par séance"}
          </p>
        </div>
        {estRecord && chronologie.length > 1 && (
          <span className="rounded-full border border-laiton-300/40 bg-laiton-300/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-laiton-200 shadow-[0_0_20px_rgba(217,180,94,0.18)]">
            Record
          </span>
        )}
      </div>

      <div className="relative mt-3" aria-label={`Évolution sur ${chronologie.length} séances`}>
        <svg viewBox={`0 0 ${largeur} ${hauteur}`} className="h-auto w-full" role="img">
          <title>
            {suitLaCharge ? "Courbe des meilleures charges" : "Courbe des répétitions"}
          </title>
          <defs>
            <linearGradient id="repcount-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#42c8ff" />
              <stop offset="70%" stopColor="#77e6ff" />
              <stop offset="100%" stopColor="#e4bd62" />
            </linearGradient>
            <linearGradient id="repcount-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#42c8ff" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#42c8ff" stopOpacity="0" />
            </linearGradient>
            <filter id="repcount-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[haut, (haut + bas) / 2, bas].map((y) => (
            <line
              key={y}
              x1={margeX}
              y1={y}
              x2={largeur - margeX}
              y2={y}
              stroke="rgba(255,255,255,0.09)"
              strokeDasharray="5 8"
            />
          ))}
          {points.length > 1 && <polygon points={zone} fill="url(#repcount-area)" />}
          {points.length > 1 && (
            <polyline
              points={trace}
              fill="none"
              stroke="url(#repcount-line)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#repcount-glow)"
            />
          )}
          {points.map((point, index) => {
            const dernierPoint = index === points.length - 1;
            return (
              <g key={`${point.x}-${chronologie[index]!.date.toISOString()}`}>
                {dernierPoint && (
                  <circle cx={point.x} cy={point.y} r="17" fill="#e4bd62" opacity="0.16">
                    <animate attributeName="r" values="12;21;12" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.24;0.04;0.24" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={dernierPoint ? 7 : 4.5}
                  fill={dernierPoint ? "#f1cf78" : "#7de7ff"}
                  stroke="#06131b"
                  strokeWidth="3"
                />
                {(dernierPoint || chronologie.length <= 4) && (
                  <text
                    x={point.x}
                    y={Math.max(point.y - 16, 15)}
                    textAnchor="middle"
                    fill={dernierPoint ? "#f1cf78" : "#b9f1ff"}
                    fontSize="16"
                    fontWeight="700"
                  >
                    {point.valeur} {unite}
                  </text>
                )}
              </g>
            );
          })}
          <text x={margeX} y="218" fill="rgba(255,255,255,.42)" fontSize="14">
            {formatDate(premierePerf.date)}
          </text>
          <text x={largeur - margeX} y="218" textAnchor="end" fill="rgba(255,255,255,.62)" fontSize="14">
            {formatDate(dernierePerf.date)}
          </text>
        </svg>
      </div>

      <div className="relative grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-center">
        <div>
          <p className="font-display text-lg font-semibold tabular-nums text-white">
            {derniere.valeur} <span className="text-xs text-graphite-400">{unite}</span>
          </p>
          <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-graphite-500">Dernière</p>
        </div>
        <div className="border-x border-white/10">
          <p className="font-display text-lg font-semibold tabular-nums text-laiton-200">
            {record} <span className="text-xs text-graphite-400">{unite}</span>
          </p>
          <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-graphite-500">Record</p>
        </div>
        <div>
          <p
            className={`font-display text-lg font-semibold tabular-nums ${
              progression !== null && progression > 0 ? "text-emerald-300" : "text-white"
            }`}
          >
            {progression === null ? "—" : `${progression > 0 ? "+" : ""}${progression}`}
            {progression !== null && <span className="ml-1 text-xs text-graphite-400">{unite}</span>}
          </p>
          <p className="font-mono text-[8px] uppercase tracking-[0.13em] text-graphite-500">Vs avant</p>
        </div>
      </div>
    </section>
  );
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

      {historique.length > 0 && <CourbeProgression historique={historique} />}

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
        <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/[0.06] px-4 py-3" role="status">
          <p className="text-sm font-semibold text-emerald-300">Séance enregistrée ✓</p>
          <p className="mt-1 text-xs text-graphite-300">
            Ta courbe est à jour. Reviens à la prochaine séance pour battre ton repère.
          </p>
        </div>
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
