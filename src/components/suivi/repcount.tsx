"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Activity } from "lucide-react";
import { ChandeliersCharges } from "@/components/suivi/chandeliers-charges";
import {
  comparerAvantApres,
  historiquePourExercice,
  historiqueParMesure,
  totalMaintien,
  formatSerie,
  type PerfExercice,
  type SetSaisi,
} from "@/lib/suivi/historique-exercice";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { firstSavedConversionId } from "@/lib/analytics/first-saved-conversion";
import { assemblerSeance, payloadSeance, nomsSeance, type ExerciceRepCount } from "@/lib/suivi/repcount-session";
import { draftKey, parseDraft, type RepCountDraft } from "@/lib/suivi/repcount-draft";
import { RepCountStepper as Stepper } from "@/components/suivi/repcount-stepper";

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
  const suitLeMaintien = sets.some(s => s.dureeSecondes != null);
  const valeurActuelle = suitLeMaintien ? totalMaintien(sets) : suitLaCharge
    ? sets.reduce((total, serie) => total + serie.reps * serie.charge, 0)
    : sets.reduce((total, serie) => total + serie.reps, 0);
  const valeurReference = suitLeMaintien ? totalMaintien(reference.sets) : suitLaCharge ? reference.volume : totalRepetitions(reference);
  const ratio = valeurReference > 0 ? valeurActuelle / valeurReference : 0;
  const pourcentage = Math.max(0, Math.round(ratio * 100));
  const progressionVisuelle = Math.min(100, pourcentage);
  const unite = suitLeMaintien ? "secondes de maintien" : suitLaCharge ? "kg de volume" : "répétitions";
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

function CourbeProgression({ historique, maintien = false }: { historique: PerfExercice[]; maintien?: boolean }) {
  const chronologie = historique.slice(0, 10).reverse();
  const suitLaCharge = chronologie.some((perf) => meilleureCharge(perf) > 0);
  const valeurs = chronologie.map((perf) =>
    maintien ? totalMaintien(perf.sets) : suitLaCharge ? meilleureCharge(perf) : totalRepetitions(perf)
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
  const unite = maintien ? "s" : suitLaCharge ? "kg" : "reps";
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
            {maintien ? "Secondes de maintien par séance" : suitLaCharge ? "Meilleure charge par séance" : "Répétitions par séance"}
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
            {maintien ? "Courbe des maintiens en secondes" : suitLaCharge ? "Courbe des meilleures charges" : "Courbe des répétitions"}
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
  userId,
}: {
  exercices: string[];
  exerciceInitial?: string;
  hasAccess?: boolean;
  onboarding?: boolean;
  userId?: string;
}) {
  const [nom, setNom] = useState(exerciceInitial);
  const [reps, setReps] = useState(10);
  const [charge, setCharge] = useState(20);
  const [maintien, setMaintien] = useState(false);
  const [dureeSecondes, setDureeSecondes] = useState(30);
  const [sets, setSets] = useState<SetSaisi[]>([]);
  const [seances, setSeances] = useState<{ date: string; exercices: unknown }[]>([]);
  const [exercicesSeance, setExercicesSeance] = useState<ExerciceRepCount[]>([]);
  const [notes, setNotes] = useState("");
  const [historiqueErreur, setHistoriqueErreur] = useState(false);
  const [repos, setRepos] = useState<number | null>(null);
  const [dureeRepos, setDureeRepos] = useState(REPOS_DEFAUT);
  const [finRepos, setFinRepos] = useState<number | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [premierRepereId, setPremierRepereId] = useState<string | null>(null);
  const prefillRef = useRef<string | null>(null);
  const sauvegardeRef = useRef<{ signature: string; date: string } | null>(null);
  const requeteEnCoursRef = useRef(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftError, setDraftError] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [routine, setRoutine] = useState<string[]>([]);

  useEffect(() => {
    if (userId) {
      try {
        const restored = parseDraft(window.localStorage.getItem(draftKey(userId)));
        if (restored) {
          setNom(restored.nom); setReps(restored.reps); setCharge(restored.charge);
          setMaintien(restored.maintien); setDureeSecondes(restored.dureeSecondes);
          setSets(restored.sets); setExercicesSeance(restored.exercicesSeance);
          setNotes(restored.notes); setDureeRepos(restored.dureeRepos); setFinRepos(restored.finRepos);
          setRoutine(restored.routine);
          sauvegardeRef.current = restored.sauvegarde;
          prefillRef.current = restored.nom.trim().toLocaleLowerCase("fr-FR");
          setDraftRestored(true);
        }
      } catch { setDraftError(true); }
    }
    setDraftReady(true);
  }, [userId]);

  const persistDraft = useCallback((currentSets: SetSaisi[] = sets) => {
    if (!userId) return;
    try {
      if (!currentSets.length && !exercicesSeance.length && !notes.trim() && !routine.length) {
        window.localStorage.removeItem(draftKey(userId));
      } else {
        const value: RepCountDraft = { version: 1, updatedAt: Date.now(), nom, reps, charge,
          maintien, dureeSecondes, sets: currentSets, exercicesSeance, notes, dureeRepos, finRepos, routine,
          sauvegarde: sauvegardeRef.current };
        window.localStorage.setItem(draftKey(userId), JSON.stringify(value));
      }
      setDraftError(false);
    } catch { setDraftError(true); }
  }, [userId, sets, exercicesSeance, notes, nom, reps, charge, maintien, dureeSecondes, dureeRepos, finRepos, routine]);

  useEffect(() => { if (draftReady) persistDraft(); }, [draftReady, persistDraft]);

  const charger = useCallback(async () => {
    try {
      const r = await fetch("/api/seances");
      if (!r.ok) throw new Error("historique_indisponible");
      const donnees = await r.json();
      if (!Array.isArray(donnees)) throw new Error("historique_invalide");
      setSeances(donnees);
      setHistoriqueErreur(false);
    } catch { setHistoriqueErreur(true); }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  // Une échéance réelle reste correcte quand iOS suspend les minuteurs.
  useEffect(() => {
    if (finRepos === null) { setRepos(null); return; }
    const actualiser = () => setRepos(Math.max(0, Math.ceil((finRepos - Date.now()) / 1000)));
    actualiser();
    const timer = window.setInterval(actualiser, 1000);
    document.addEventListener("visibilitychange", actualiser);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", actualiser);
    };
  }, [finRepos]);

  const historique = useMemo(
    () => (nom.trim() ? historiquePourExercice(seances, nom) : []),
    [seances, nom]
  );
  const historiqueMesure = useMemo(() => historiqueParMesure(historique, maintien), [historique, maintien]);
  const comparaison = useMemo(() => comparerAvantApres(historiqueMesure), [historiqueMesure]);

  // À l'ouverture depuis un bilan de séance, reprend automatiquement la
  // meilleure série connue. L'utilisateur retrouve son repère sans le
  // mémoriser ni le recopier, mais garde la main sur les deux steppers.
  useEffect(() => {
    const cle = nom.trim().toLocaleLowerCase("fr-FR");
    const derniereSerie = historique[0]?.meilleureSerie;
    if (!cle || !derniereSerie || prefillRef.current === cle || sets.length > 0) return;
    setReps(derniereSerie.reps);
    setCharge(derniereSerie.charge);
    setMaintien(derniereSerie.dureeSecondes != null);
    if (derniereSerie.dureeSecondes != null) setDureeSecondes(derniereSerie.dureeSecondes);
    prefillRef.current = cle;
  }, [historique, nom, sets.length]);

  const volumeCourant = sets.reduce((t, s) => t + s.reps * s.charge, 0);

  const ajouterSerie = useCallback(() => {
    setSets((s) => [...s, maintien ? { reps: 0, charge: 0, dureeSecondes } : { reps, charge }]);
    setFinRepos(Date.now() + dureeRepos * 1000);
    setEnregistre(false);
  }, [reps, charge, maintien, dureeSecondes, dureeRepos]);

  const sauvegarder = useCallback(async (seriesAEnregistrer: SetSaisi[]) => {
    if (requeteEnCoursRef.current) return;
    const exercicesComplets = assemblerSeance(exercicesSeance, nom, seriesAEnregistrer);
    if (!exercicesComplets.length) return;
    const signature = JSON.stringify({ exercices: exercicesComplets, notes });
    if (sauvegardeRef.current?.signature !== signature) {
      sauvegardeRef.current = { signature, date: new Date().toISOString() };
    }
    requeteEnCoursRef.current = true;
    persistDraft(seriesAEnregistrer);
    setErreur(null);
    setEnregistrementEnCours(true);
    try {
      const r = await fetch("/api/seances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: sauvegardeRef.current.date,
          source: "REPCOUNT",
          exercices: payloadSeance(exercicesComplets),
          notes: notes.trim() || undefined,
        }),
      });
      if (!r.ok) throw new Error("enregistrement_refuse");
      const firstId = await firstSavedConversionId(r, "REPCOUNT");
      if (firstId) setPremierRepereId(firstId);
      sauvegardeRef.current = null;
      setDraftRestored(false);
      setSets([]);
      setExercicesSeance([]);
      setRoutine([]);
      setNotes("");
      setFinRepos(null);
      setEnregistre(true);
      void charger();
    } catch {
      setErreur("L'enregistrement a échoué. Réessaie.");
    } finally {
      requeteEnCoursRef.current = false;
      setEnregistrementEnCours(false);
    }
  }, [nom, charger, exercicesSeance, notes, persistDraft]);

  function exerciceSuivant() {
    if (!nom.trim() || !sets.length || enregistrementEnCours) return;
    setExercicesSeance(assemblerSeance(exercicesSeance, nom, sets));
    setSets([]);
    const suite = routine[0] === nom.trim() ? routine.slice(1) : routine;
    setRoutine(suite);
    setNom(suite[0] ?? "");
    setCharge(0);
    setReps(10);
    setMaintien(false);
    setFinRepos(null);
    prefillRef.current = null;
    setEnregistre(false);
    document.getElementById("repcount-exercice")?.focus();
  }

  const enregistrer = useCallback(async () => {
    await sauvegarder(sets);
  }, [sauvegarder, sets]);

  const enregistrerPremierRepere = useCallback(async () => {
    await sauvegarder([maintien ? { reps: 0, charge: 0, dureeSecondes } : { reps, charge }]);
  }, [sauvegarder, reps, charge, maintien, dureeSecondes]);

  const seancesReutilisables = useMemo(() => seances
    .filter(seance => Number.isFinite(new Date(seance.date).getTime()))
    .map(seance => ({ date: seance.date, noms: nomsSeance(seance.exercices) }))
    .filter(seance => seance.noms.length > 0).slice(0, 5), [seances]);
  const brouillonEnCours = sets.length > 0 || exercicesSeance.length > 0 || notes.trim().length > 0 || routine.length > 0;

  return (
    <fieldset disabled={enregistrementEnCours || Boolean(userId && !draftReady)} className="flex min-w-0 flex-col gap-5">
      {premierRepereId && <TrackConversion name="first_repcount_saved" onceKey={premierRepereId} />}
      <section className="rounded-2xl border border-laiton-300/25 bg-gradient-to-br from-laiton-300/10 to-cyan-300/5 p-4">
        <p className="text-sm font-semibold text-laiton-200">Ma séance RepCount</p>
        <p className="mt-1 text-sm text-white">{exercicesSeance.length + (sets.length && !exercicesSeance.some(ex => ex.nom === nom.trim()) ? 1 : 0)} exercices · {exercicesSeance.reduce((total, ex) => total + ex.sets.length, sets.length)} séries validées</p>
        <p className="mt-2 text-xs leading-5 text-graphite-300">Valide tes séries, passe à l’exercice suivant, puis enregistre la séance complète pour l’ajouter à ton historique.</p>
        {userId && <p role="status" className="mt-2 text-xs leading-5 text-graphite-300">
          {draftError ? "Brouillon non conservé sur cet appareil. Ne ferme pas cette page avant d’enregistrer ta séance."
            : draftRestored ? "Brouillon retrouvé. Tu peux reprendre ta séance."
              : "Brouillon conservé sur cet appareil pendant 7 jours, pour ce compte uniquement. Il n’est pas synchronisé entre appareils."}
        </p>}
        {exercicesSeance.length > 0 && <ul className="mt-3 space-y-2">
          {exercicesSeance.map((exercice, index) => <li key={exercice.nom} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm text-white">{exercice.nom}</p>
            <p className="mt-1 text-xs text-graphite-300">{exercice.sets.map(formatSerie).join(" · ")}</p>
            <button type="button" disabled={sets.length > 0 || enregistrementEnCours} className="mt-1 min-h-11 text-xs text-cyan-200 underline disabled:opacity-40" onClick={() => {
              setNom(exercice.nom); setSets(exercice.sets.map(serie => ({ ...serie })));
              setMaintien(exercice.sets[0]?.dureeSecondes != null);
              setExercicesSeance(liste => liste.filter((_, i) => i !== index));
              setFinRepos(null);
            }}>Reprendre cet exercice</button>
          </li>)}
        </ul>}
      </section>
      {routine.length > 0 && <section className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
        <p className="text-sm font-semibold text-cyan-200">Exercices à réaliser</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-graphite-300">
          {routine.map(exercice => <li key={exercice}>{exercice}{exercice === nom.trim() ? " · en cours" : ""}</li>)}
        </ol>
        <p className="mt-2 text-xs text-graphite-300">Les anciennes séries ne sont pas recopiées. Valide uniquement celles que tu réalises aujourd’hui.</p>
        <button type="button" onClick={() => setRoutine([])} className="mt-2 min-h-11 text-xs text-cyan-200 underline">Continuer en séance libre</button>
      </section>}
      {seancesReutilisables.length > 0 && <details className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
        <summary className="min-h-11 cursor-pointer text-sm font-semibold text-white">Reprendre une séance passée</summary>
        <p className="mb-3 text-xs leading-5 text-graphite-300">Retrouve les exercices dans le même ordre. Adapte tes charges à ta forme du jour.</p>
        {brouillonEnCours && <p className="mb-3 text-xs text-amber-200">Termine ta séance en cours avant d’en reprendre une autre.</p>}
        <ul className="space-y-3">{seancesReutilisables.map((seance, index) => <li key={`${seance.date}-${index}`} className="rounded-xl border border-white/10 p-3">
          <p className="text-sm font-semibold text-white">Séance du {formatDate(new Date(seance.date))}</p>
          <p className="mt-1 text-xs leading-5 text-graphite-300">{seance.noms.join(" · ")}</p>
          <button type="button" disabled={brouillonEnCours} onClick={() => {
            const premier = seance.noms[0];
            if (brouillonEnCours || !premier) return;
            const repere = historiquePourExercice(seances, premier)[0]?.meilleureSerie;
            setRoutine(seance.noms); setNom(premier);
            setReps(repere?.reps || 10); setCharge(repere?.charge ?? 0);
            setMaintien(repere?.dureeSecondes != null); setDureeSecondes(repere?.dureeSecondes ?? 30);
            prefillRef.current = null; setEnregistre(false); setErreur(null);
            document.getElementById("repcount-exercice")?.focus();
          }} className="mt-2 min-h-11 rounded-lg border border-laiton-300/30 px-3 text-sm text-laiton-200 disabled:opacity-40">Reprendre ces exercices</button>
        </li>)}</ul>
      </details>}
      {historiqueErreur && <p role="status" className="text-sm text-amber-200">Historique indisponible. Tes séries en cours sont conservées. <button type="button" onClick={() => void charger()} className="min-h-11 underline">Réessayer</button></p>}
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
          disabled={sets.length > 0 || enregistrementEnCours}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Développé couché, squat…"
          className="mt-1.5 w-full rounded-xl border border-white/12 bg-black/40 px-4 py-3.5 text-base text-white placeholder:text-graphite-500"
        />
        <datalist id="repcount-liste">
          {exercices.map((e) => (
            <option key={e} value={e} />
          ))}
        </datalist>
        {sets.length > 0 && <p className="mt-2 text-xs text-graphite-400">Enregistre ou retire les séries en cours avant de changer d’exercice.</p>}
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
              .map(formatSerie)
              .join("  ·  ")}
          </p>
          <p className="mt-1 text-xs text-graphite-400">
            {maintien ? `${totalMaintien(comparaison.precedente.sets)} s de maintien cumulé` : `Volume ${Math.round(comparaison.precedente.volume)} kg`}
            {!maintien && comparaison.deltaVolume !== null && (
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

      {historiqueMesure.length > 0 && <details className="rounded-xl border border-cyan-300/20 p-4">
        <summary className="min-h-11 cursor-pointer text-sm font-semibold text-cyan-200">Voir ma progression · {historiqueMesure.length} séances</summary>
        <CourbeProgression historique={historiqueMesure} maintien={maintien} />
        {!maintien && <ChandeliersCharges key={nom.trim()} historique={historiqueMesure} />}
      </details>}

      <label className="text-sm text-graphite-300">Repos entre les séries
        <select value={dureeRepos} onChange={e => setDureeRepos(Number(e.target.value))} className="mt-2 min-h-11 w-full rounded-xl border border-white/15 bg-slate-950 px-3 text-white">
          {[30, 60, 90, 120, 180].map(secondes => <option key={secondes} value={secondes}>{Math.floor(secondes / 60)} min{secondes % 60 ? ` ${secondes % 60} s` : ""}</option>)}
        </select>
      </label>

      <label className="text-sm text-graphite-300">Mesure de la série
        <select value={maintien ? "maintien" : "repetitions"} disabled={sets.length > 0} onChange={e => setMaintien(e.target.value === "maintien")} className="mt-2 min-h-11 w-full rounded-xl border border-white/15 bg-slate-950 px-3 text-white disabled:opacity-50">
          <option value="repetitions">Répétitions et charge</option>
          <option value="maintien">Maintien isométrique (secondes)</option>
        </select>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        {maintien ? <Stepper label="Maintien" valeur={dureeSecondes} setValeur={setDureeSecondes} pas={5} unite="s" minimum={1} maximum={3600} entier /> : <>
          <Stepper label="Répétitions" valeur={reps} setValeur={setReps} pas={1} unite="" minimum={1} entier />
          <Stepper label="Charge" valeur={charge} setValeur={setCharge} pas={2.5} unite="kg" />
        </>}
      </div>

      {onboarding && sets.length === 0 && exercicesSeance.length === 0 && historique.length === 0 ? (
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
          disabled={!nom.trim() || enregistrementEnCours}
          className="rounded-full bg-cyan-300 py-4 text-base font-bold text-[#04121a] transition disabled:opacity-40"
        >
          Valider la série
        </button>
      )}

      {repos !== null && (
        <div className="rounded-xl border border-cyan-300/25 bg-cyan-300/[0.06] px-4 py-3 text-center" role="status">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-200">{repos === 0 ? "Repos terminé" : "Repos"}</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-white">
            {Math.floor(repos / 60)}:{String(repos % 60).padStart(2, "0")}
          </p>
          <button
            type="button"
            onClick={() => setFinRepos(null)}
            className="mt-1 text-xs text-graphite-400 underline"
          >
            Fermer le minuteur
          </button>
        </div>
      )}

      {sets.length > 0 && comparaison.precedente && (
        <JumeauSeance sets={sets} reference={comparaison.precedente} />
      )}

      {sets.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-400">
            {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} · {maintien ? `${totalMaintien(sets)} s de maintien` : `${Math.round(volumeCourant)} kg de volume`}
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {sets.map((s, i) => (
              <li key={i} className="flex items-center justify-between text-sm text-white">
                <span>
                  Série {i + 1} — {formatSerie(s)}
                </span>
                <div className="flex gap-2">
                <details>
                  <summary className="min-h-11 cursor-pointer py-3 text-xs text-cyan-200">Corriger</summary>
                  {(s.dureeSecondes != null ? ["dureeSecondes"] as const : ["reps", "charge"] as const).map(champ => <label key={champ} className="block text-xs">
                    {champ === "reps" ? "Répétitions" : champ === "charge" ? "Charge (kg)" : "Maintien (s)"}
                    <input type="number" aria-label={`Série ${i + 1} ${champ}`} disabled={enregistrementEnCours} value={s[champ] ?? 0} min={champ === "charge" ? 0 : 1} step={champ === "charge" ? 0.5 : 1} className="mb-2 min-h-11 w-24 rounded border border-white/20 bg-slate-950 px-2" onChange={e => {
                      const valeur = Number(e.target.value);
                      if (!Number.isFinite(valeur) || valeur < (champ === "charge" ? 0 : 1) || (champ !== "charge" && !Number.isInteger(valeur)) || (champ === "dureeSecondes" && valeur > 3600)) return;
                      setSets(liste => liste.map((serie, j) => j === i ? { ...serie, [champ]: valeur } : serie));
                    }} />
                  </label>)}
                </details>
                <button
                  type="button"
                  disabled={enregistrementEnCours}
                  onClick={() => setSets((liste) => liste.filter((_, j) => j !== i))}
                  className="min-h-11 text-xs text-graphite-400 underline disabled:opacity-40"
                >
                  retirer
                </button>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" disabled={enregistrementEnCours} onClick={() => {
            setSets(liste => [...liste, { ...liste[liste.length - 1]! }]);
            setFinRepos(Date.now() + dureeRepos * 1000);
          }} className="mt-3 min-h-11 w-full rounded-xl border border-cyan-300/25 text-sm text-cyan-200 disabled:opacity-40">Valider une série identique à la dernière</button>
          <button type="button" onClick={exerciceSuivant} disabled={enregistrementEnCours} className="mt-3 min-h-12 w-full rounded-full border border-cyan-300/30 py-3 text-sm font-bold text-cyan-200 disabled:opacity-40">Ajouter un autre exercice →</button>
        </div>
      )}

      {(sets.length > 0 || exercicesSeance.length > 0) && <section className="rounded-2xl border border-laiton-300/25 bg-laiton-300/5 p-4">
        <label htmlFor="repcount-notes" className="text-sm text-graphite-300">Notes de séance (facultatif)</label>
        <textarea id="repcount-notes" value={notes} maxLength={2000} disabled={enregistrementEnCours} onChange={e => setNotes(e.target.value)} placeholder="Sensations, réglages de machine…" className="mt-2 min-h-20 w-full rounded-xl border border-white/15 bg-slate-950 p-3 text-sm text-white" />
        <button type="button" onClick={enregistrer} disabled={enregistrementEnCours} className="mt-3 min-h-12 w-full rounded-full bg-laiton-300 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{enregistrementEnCours ? "Enregistrement…" : "Terminer et enregistrer la séance"}</button>
      </section>}

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
                <span className="text-white">{perf.sets.map(formatSerie).join(" · ")}</span>
                <span className="tabular-nums text-graphite-400">{totalMaintien(perf.sets) > 0 ? `${totalMaintien(perf.sets)} s` : `${Math.round(perf.volume)} kg`}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </fieldset>
  );
}
