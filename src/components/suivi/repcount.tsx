"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import {
  comparerAvantApres,
  historiquePourExercice,
  type PerfExercice,
  type SetSaisi,
} from "@/lib/suivi/historique-exercice";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

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

function JumeauSeance({
  sets,
  reference,
}: {
  sets: SetSaisi[];
  reference: PerfExercice;
}) {
  const suitLaCharge =
    reference.sets.some((serie) => serie.charge > 0) || sets.some((serie) => serie.charge > 0);
  const valeurActuelle = suitLaCharge
    ? sets.reduce((total, serie) => total + serie.reps * serie.charge, 0)
    : sets.reduce((total, serie) => total + serie.reps, 0);
  const valeurReference = suitLaCharge ? reference.volume : totalRepetitions(reference);
  const ratio = valeurReference > 0 ? valeurActuelle / valeurReference : 0;
  const pourcentage = Math.max(0, Math.round(ratio * 100));
  const progressionVisuelle = Math.min(100, pourcentage);
  const unite = suitLaCharge ? "kg de volume" : "répétitions";
  const lecture =
    ratio < 0.5
      ? "Ta séance prend forme."
      : ratio < 0.9
        ? "Tu retrouves progressivement ta dernière référence."
        : ratio <= 1.1
          ? "Ton volume est comparable à ta dernière séance."
          : "Ton volume actuel est supérieur à ta dernière séance.";

  return (
    <section className="relative overflow-hidden rounded-2xl border border-violet-300/25 bg-[radial-gradient(circle_at_100%_0%,rgba(56,189,248,.17),transparent_18rem),radial-gradient(circle_at_0%_100%,rgba(139,92,246,.14),transparent_20rem),#090d18] p-4 shadow-[0_22px_60px_-35px_rgba(56,189,248,.65)]">
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200 to-transparent" />
      <div className="relative flex items-center gap-4">
        <div
          className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full p-[2px] shadow-[0_0_34px_rgba(34,211,238,.12)]"
          style={{
            background: `conic-gradient(#67e8f9 ${progressionVisuelle * 3.6}deg, rgba(255,255,255,.08) 0deg)`,
          }}
          role="img"
          aria-label={`${pourcentage}% du volume de la dernière séance`}
        >
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-white/[0.06] bg-[#090d18]">
            <Activity size={17} className="text-cyan-200" aria-hidden="true" />
            <strong className="mt-1 font-display text-2xl font-semibold tabular-nums text-white">
              {pourcentage}%
            </strong>
            <span className="font-mono text-[7px] uppercase tracking-[0.13em] text-graphite-500">référence</span>
          </div>
          <span className="pointer-events-none absolute inset-[-7px] animate-pulse rounded-full border border-dashed border-cyan-200/15 motion-reduce:animate-none" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-cyan-200">
            COAI Live Twin
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold text-white">Ta séance, en direct.</h3>
          <p className="mt-1 text-xs leading-5 text-graphite-300">{lecture}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-2">
              <p className="font-display text-base font-semibold tabular-nums text-white">{Math.round(valeurActuelle)}</p>
              <p className="text-[9px] text-graphite-500">{unite} maintenant</p>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-2.5 py-2">
              <p className="font-display text-base font-semibold tabular-nums text-laiton-200">{Math.round(valeurReference)}</p>
              <p className="text-[9px] text-graphite-500">dernière séance</p>
            </div>
          </div>
        </div>
      </div>
      <p className="relative mt-3 border-t border-white/[0.07] pt-2.5 text-center text-[10px] leading-4 text-graphite-500">
        Comparaison personnelle en direct · ce repère n&apos;est pas un objectif à dépasser
      </p>
    </section>
  );
}

function prochainCap({
  nombreSeances,
  derniereValeur,
  record,
  progression,
  unite,
}: {
  nombreSeances: number;
  derniereValeur: number;
  record: number;
  progression: number | null;
  unite: string;
}) {
  if (nombreSeances === 1) {
    return {
      titre: "Ta référence est posée",
      texte: "Deux nouvelles séances permettront à COAI de confirmer une vraie tendance.",
      progression: 1 / 3,
    };
  }
  if (nombreSeances === 2) {
    return {
      titre: "La tendance se dessine",
      texte: "Encore une séance suivie pour obtenir un repère plus fiable.",
      progression: 2 / 3,
    };
  }
  if (derniereValeur < record) {
    return {
      titre: `Prochain cap · retrouver ${record} ${unite}`,
      texte: "Vise d’abord une exécution propre et sans douleur. Le record attendra si la forme du jour ne suit pas.",
      progression: Math.max(0.15, derniereValeur / Math.max(record, 1)),
    };
  }
  if (progression !== null && progression > 0) {
    return {
      titre: "Nouveau cap validé",
      texte: "Confirme ce niveau une deuxième séance avec une exécution propre avant de monter davantage.",
      progression: 1,
    };
  }
  return {
    titre: "Ton record est stabilisé",
    texte: "Cherche une répétition plus fluide ou plus propre avant d’augmenter la difficulté.",
    progression: 1,
  };
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
  const cap = prochainCap({
    nombreSeances: chronologie.length,
    derniereValeur: derniere.valeur,
    record,
    progression,
    unite,
  });

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

      <div className="relative mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/25 p-3.5">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-300/[0.09] to-transparent transition-[width] duration-700 motion-reduce:transition-none"
          style={{ width: `${Math.min(100, Math.round(cap.progression * 100))}%` }}
          aria-hidden="true"
        />
        <div className="relative flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-300/10 text-xs text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.16)]">
            ◉
          </span>
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-cyan-200">
              Coach RepCount
            </p>
            <p className="mt-1 text-sm font-semibold text-white">{cap.titre}</p>
            <p className="mt-1 text-xs leading-5 text-graphite-300">{cap.texte}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function RepCount({
  exercices,
  exerciceInitial = "",
  hasAccess = false,
  onboarding = false,
}: {
  exercices: string[];
  exerciceInitial?: string;
  hasAccess?: boolean;
  onboarding?: boolean;
}) {
  const [nom, setNom] = useState(exerciceInitial);
  const [reps, setReps] = useState(10);
  const [charge, setCharge] = useState(20);
  const [sets, setSets] = useState<SetSaisi[]>([]);
  const [seances, setSeances] = useState<{ date: string; exercices: unknown }[]>([]);
  const [repos, setRepos] = useState<number | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const prefillRef = useRef<string | null>(null);
  const sauvegardeRef = useRef<{ signature: string; date: string } | null>(null);
  const requeteEnCoursRef = useRef(false);

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

  // À l'ouverture depuis un bilan de séance, reprend automatiquement la
  // meilleure série connue. L'utilisateur retrouve son repère sans le
  // mémoriser ni le recopier, mais garde la main sur les deux steppers.
  useEffect(() => {
    const cle = nom.trim().toLocaleLowerCase("fr-FR");
    const derniereSerie = comparaison.precedente?.meilleureSerie;
    if (!cle || !derniereSerie || prefillRef.current === cle || sets.length > 0) return;
    setReps(derniereSerie.reps);
    setCharge(derniereSerie.charge);
    prefillRef.current = cle;
  }, [comparaison.precedente, nom, sets.length]);

  const volumeCourant = sets.reduce((t, s) => t + s.reps * s.charge, 0);

  const ajouterSerie = useCallback(() => {
    setSets((s) => [...s, { reps, charge }]);
    setRepos(REPOS_DEFAUT);
    setEnregistre(false);
  }, [reps, charge]);

  const sauvegarder = useCallback(async (seriesAEnregistrer: SetSaisi[]) => {
    if (!nom.trim() || seriesAEnregistrer.length === 0 || requeteEnCoursRef.current) return;
    const signature = JSON.stringify({ nom: nom.trim(), series: seriesAEnregistrer });
    if (sauvegardeRef.current?.signature !== signature) {
      sauvegardeRef.current = { signature, date: new Date().toISOString() };
    }
    requeteEnCoursRef.current = true;
    setErreur(null);
    setEnregistrementEnCours(true);
    try {
      const r = await fetch("/api/seances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: sauvegardeRef.current.date,
          source: "REPCOUNT",
          exercices: [
            {
              nom: nom.trim(),
              sets: seriesAEnregistrer.map((s, i) => ({ set: i + 1, reps: s.reps, charge: s.charge })),
            },
          ],
        }),
      });
      if (!r.ok) throw new Error("enregistrement_refuse");
      sauvegardeRef.current = null;
      setSets([]);
      setRepos(null);
      setEnregistre(true);
      if (r.headers.get("X-COAI-First-Source") === "1") {
        trackFunnelEvent("first_repcount_saved");
      }
      void charger();
    } catch {
      setErreur("L'enregistrement a échoué. Réessaie.");
    } finally {
      requeteEnCoursRef.current = false;
      setEnregistrementEnCours(false);
    }
  }, [nom, charger]);

  const enregistrer = useCallback(async () => {
    await sauvegarder(sets);
  }, [sauvegarder, sets]);

  const enregistrerPremierRepere = useCallback(async () => {
    await sauvegarder([{ reps, charge }]);
  }, [sauvegarder, reps, charge]);

  const Stepper = ({
    label,
    valeur,
    setValeur,
    pas,
    unite,
    minimum = 0,
  }: {
    label: string;
    valeur: number;
    setValeur: (v: number) => void;
    pas: number;
    unite: string;
    minimum?: number;
  }) => (
    <div className="flex-1">
      <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-400">
        {label}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setValeur(Math.max(minimum, +(valeur - pas).toFixed(1)))}
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
      {onboarding && historique.length === 0 && !enregistre && (
        <section className="relative overflow-hidden rounded-2xl border border-cyan-300/25 bg-[radial-gradient(circle_at_90%_0%,rgba(34,211,238,.15),transparent_15rem),rgba(255,255,255,.025)] p-4">
          <div aria-hidden="true" className="absolute -right-10 -top-10 h-28 w-28 rounded-full border border-laiton-300/15" />
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-laiton-200">Première victoire · moins d’une minute</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] text-graphite-300">
            {["Choisis", "Ajuste", "Enregistre"].map((etape, index) => (
              <div key={etape} className="rounded-xl border border-white/[0.08] bg-black/20 px-2 py-2.5">
                <span className="mx-auto mb-1 grid h-5 w-5 place-items-center rounded-full border border-cyan-300/25 text-[9px] font-bold text-cyan-200">{index + 1}</span>
                {etape}
              </div>
            ))}
          </div>
        </section>
      )}

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
        {onboarding && !nom && (
          <div className="mt-2.5 flex flex-wrap gap-2" aria-label="Mouvements rapides">
            {[
              { nom: "Squat poids du corps", charge: 0 },
              { nom: "Pompes", charge: 0 },
              { nom: "Développé couché (barre)", charge: 20 },
            ].map((choix) => (
              <button
                key={choix.nom}
                type="button"
                onClick={() => { setNom(choix.nom); setCharge(choix.charge); }}
                className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-[11px] font-semibold text-graphite-200 transition hover:border-cyan-300/30 hover:text-white"
              >
                {choix.nom}
              </button>
            ))}
          </div>
        )}
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
          <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.13em] text-laiton-200/80">
            Repère repris automatiquement ↓
          </p>
        </div>
      )}

      {historique.length > 0 && <CourbeProgression historique={historique} />}

      <div className="flex gap-3">
        <Stepper label="Répétitions" valeur={reps} setValeur={setReps} pas={1} unite="" minimum={1} />
        <Stepper label="Charge" valeur={charge} setValeur={setCharge} pas={2.5} unite="kg" />
      </div>

      {onboarding && sets.length === 0 && historique.length === 0 ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={enregistrerPremierRepere}
            disabled={!nom.trim() || enregistrementEnCours}
            className="coai-rainbow-cta rounded-full py-4 text-base font-extrabold text-[#071116] transition disabled:opacity-40"
          >
            {enregistrementEnCours ? "Enregistrement…" : "Enregistrer mon premier repère →"}
          </button>
          <button type="button" onClick={ajouterSerie} disabled={!nom.trim()} className="py-2 text-xs text-graphite-400 underline disabled:opacity-40">
            Je veux ajouter plusieurs séries
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={ajouterSerie}
          disabled={!nom.trim()}
          className="rounded-full bg-cyan-300 py-4 text-base font-bold text-[#04121a] transition disabled:opacity-40"
        >
          Valider la série
        </button>
      )}

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

      {sets.length > 0 && comparaison.precedente && (
        <JumeauSeance sets={sets} reference={comparaison.precedente} />
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
            disabled={enregistrementEnCours}
            className="mt-4 w-full rounded-full border border-laiton-300/40 bg-laiton-300/10 py-3 text-sm font-bold text-laiton-200 disabled:cursor-wait disabled:opacity-60"
          >
            {enregistrementEnCours ? "Enregistrement…" : "Enregistrer l'exercice"}
          </button>
        </div>
      )}

      {erreur && <p className="text-sm text-rose-300">{erreur}</p>}
      {enregistre && (
        <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/[0.06] px-4 py-3" role="status">
          <p className="text-sm font-semibold text-emerald-300">{onboarding ? "Premier repère posé ✓" : "Séance enregistrée ✓"}</p>
          <p className="mt-1 text-xs text-graphite-300">
            {onboarding
              ? "Ta progression commence maintenant. La prochaine séance donnera à COAI un premier point de comparaison."
              : "Ta courbe est à jour. Reviens à la prochaine séance pour battre ton repère."}
          </p>
          {onboarding && (
            <Link href="/dashboard" className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/[0.07] px-5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/[0.12]">
              Voir mon espace COAI →
            </Link>
          )}
          {!hasAccess && (
            <div className="mt-3 border-t border-emerald-200/15 pt-3">
              <p className="text-xs leading-5 text-graphite-200">
                RepCount mesure tes progrès. L&apos;accompagnement COAI ajoute le programme qui te dit quoi faire pour les provoquer.
              </p>
              <Link
                href="/pricing?source=repcount"
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-laiton-300/35 bg-laiton-300/10 px-5 text-sm font-bold text-laiton-100 transition hover:bg-laiton-300/15"
              >
                Découvrir mon accompagnement →
              </Link>
            </div>
          )}
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
