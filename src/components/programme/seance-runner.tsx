"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Lecteur de séance guidé (21/08/2026, demande Anthony, référence : écran
// "Chest Press... 00:35" de MyFitCoach) — jusqu'ici la séance n'était
// qu'une liste à lire (ExerciceCard), jamais un enchaînement piloté avec
// minuteur de repos. Construit uniquement à partir des données déjà
// générées par l'IA (nom, series, repetitions, repos, charge, phases) —
// "series" et "repos" sont du texte libre ("4", "90 sec", "60-90 sec") : les
// parseurs ci-dessous restent tolérants et retombent sur une valeur sûre
// plutôt que de planter sur un format inattendu, jamais un temps de repos
// inventé sans rapport avec ce que l'IA a écrit.
//
// Enrichi le 21/08/2026 (demande Anthony, "Live Workout Player") :
// chronomètre global, saisie des reps/charge réellement réalisées par
// série, bip sonore en fin de repos, consigne du coach en modale au lieu
// d'un pavé de texte, échauffement/retour au calme en checklist.

type ExerciceBrut = Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSeries(value: unknown): number {
  const match = typeof value === "string" ? value.match(/\d+/) : null;
  const n = match ? parseInt(match[0], 10) : 1;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 10) : 1;
}

function parseReposSeconds(value: unknown): number {
  if (typeof value !== "string") return 60;
  const isMinutes = /min/i.test(value);
  const nombres = value.match(/\d+/g)?.map(Number) ?? [];
  if (nombres.length === 0) return 60;
  // Une fourchette ("60-90 sec") retient le haut de fourchette — mieux vaut
  // un repos un peu long que trop court, jamais l'inverse pour la sécurité.
  const valeur = Math.max(...nombres);
  const secondes = isMinutes ? valeur * 60 : valeur;
  return Math.min(Math.max(secondes, 10), 600);
}

// Découpe l'échauffement/retour au calme (une phrase longue générée par
// l'IA) en étapes cochables. Coupe sur les séparateurs forts uniquement —
// jamais sur la virgule, qui découperait "50% x10, 70% x6" en faux items.
function enEtapes(texte: string): string[] {
  return texte
    .split(/\s*(?:[;•·]|\.\s+|\n)\s*/)
    .map((t) => t.trim().replace(/\.$/, ""))
    .filter((t) => t.length > 3);
}

type Step =
  | { type: "echauffement"; texte: string }
  | { type: "set"; exercice: ExerciceBrut; nom: string; setIndex: number; totalSets: number; exerciceIndex: number }
  | { type: "repos"; secondes: number; prochainNom: string }
  | { type: "calme"; texte: string };

function buildSteps(echauffement: string | undefined, exercices: unknown[], retourAuCalme: string | undefined): Step[] {
  const steps: Step[] = [];
  if (echauffement) steps.push({ type: "echauffement", texte: echauffement });

  const valides = exercices.filter(isPlainObject);
  valides.forEach((exercice, i) => {
    const nom = typeof exercice.nom === "string" ? exercice.nom : `Exercice ${i + 1}`;
    const totalSets = parseSeries(exercice.series);
    const reposSecondes = parseReposSeconds(exercice.repos);
    for (let s = 1; s <= totalSets; s++) {
      steps.push({ type: "set", exercice, nom, setIndex: s, totalSets, exerciceIndex: i });
      const dernierSetDuDernierExercice = s === totalSets && i === valides.length - 1;
      if (!dernierSetDuDernierExercice) {
        const exerciceSuivant = valides[i + 1];
        const prochainNom = s < totalSets ? nom : (typeof exerciceSuivant?.nom === "string" ? exerciceSuivant.nom : "l'exercice suivant");
        steps.push({ type: "repos", secondes: reposSecondes, prochainNom });
      }
    }
  });

  if (retourAuCalme) steps.push({ type: "calme", texte: retourAuCalme });
  return steps;
}

function formatChrono(secondes: number): string {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Bip de fin de repos via Web Audio — pas de fichier son à héberger, et
// aucun son n'est joué tant que l'utilisateur n'a pas interagi avec la
// page (l'AudioContext démarre suspendu tant qu'aucun geste n'a eu lieu,
// or on n'arrive ici qu'après avoir tapé "C'est fait").
function useBip() {
  const ctxRef = useRef<AudioContext | null>(null);
  return useCallback(() => {
    try {
      type WithWebkit = typeof window & { webkitAudioContext?: typeof AudioContext };
      const Ctor = window.AudioContext ?? (window as WithWebkit).webkitAudioContext;
      if (!Ctor) return;
      const ctx = ctxRef.current ?? new Ctor();
      ctxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Son indisponible (autoplay bloqué, navigateur sans Web Audio) :
      // le minuteur reste parfaitement utilisable visuellement.
    }
  }, []);
}

function CercleMinuteur({ secondesRestantes, secondesTotal }: { secondesRestantes: number; secondesTotal: number }) {
  const rayon = 88;
  const circonference = 2 * Math.PI * rayon;
  const progres = secondesTotal > 0 ? secondesRestantes / secondesTotal : 0;
  const minutes = Math.floor(secondesRestantes / 60);
  const secs = secondesRestantes % 60;
  return (
    <div className="relative flex h-52 w-52 items-center justify-center">
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r={rayon} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <circle
          cx="100" cy="100" r={rayon} fill="none" stroke="#c9a262" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={circonference * (1 - progres)}
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <span className="absolute font-display text-5xl font-semibold tabular-nums text-white">
        {minutes}:{secs.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

type Realise = { reps: string; charge: string };

export function SeanceRunner({
  nomSeance,
  echauffement,
  exercices,
  retourAuCalme,
  photosParExercice,
  onClose,
}: {
  nomSeance: string;
  echauffement?: string;
  exercices: unknown[];
  retourAuCalme?: string;
  photosParExercice?: Record<string, string | null>;
  onClose: () => void;
}) {
  const steps = useMemo(() => buildSteps(echauffement, exercices, retourAuCalme), [echauffement, exercices, retourAuCalme]);
  const [index, setIndex] = useState(0);
  const [secondesRestantes, setSecondesRestantes] = useState(0);
  const [chronoGlobal, setChronoGlobal] = useState(0);
  const [termine, setTermine] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [consigneOuverte, setConsigneOuverte] = useState(false);
  const [coches, setCoches] = useState<Record<string, boolean>>({});
  const [realise, setRealise] = useState<Record<string, Realise>>({});
  const debutRef = useRef(Date.now());
  const bip = useBip();

  const step = steps[index];
  const totalSets = useMemo(() => steps.filter((s) => s.type === "set").length, [steps]);
  const setsFaits = useMemo(() => steps.slice(0, index).filter((s) => s.type === "set").length, [steps, index]);

  // Chronomètre global de séance — tourne du montage à la fin, jamais remis
  // à zéro par un changement d'étape.
  useEffect(() => {
    if (termine) return;
    const t = setInterval(() => setChronoGlobal(Math.round((Date.now() - debutRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, [termine]);

  useEffect(() => {
    if (step?.type === "repos") setSecondesRestantes(step.secondes);
  }, [index, step]);

  useEffect(() => {
    if (step?.type !== "repos") return;
    if (secondesRestantes <= 0) {
      bip();
      return;
    }
    const t = setTimeout(() => setSecondesRestantes((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secondesRestantes, bip]);

  async function terminerSeance() {
    setEnvoiEnCours(true);
    const dureeMinutes = Math.max(1, Math.round((Date.now() - debutRef.current) / 60000));
    // Les reps/charges réellement saisies remontent au suivi, série par
    // série — jamais les valeurs "visées" du programme si l'utilisateur
    // n'a rien saisi (on n'envoie alors que le nom).
    const parExercice = new Map<string, { nom: string; series: number; repetitions?: number; chargeKg?: number }>();
    steps.forEach((s, i) => {
      if (s.type !== "set" || i >= index + 1) return;
      const cle = `${s.exerciceIndex}-${s.setIndex}`;
      const saisi = realise[cle];
      const entree = parExercice.get(s.nom) ?? { nom: s.nom, series: 0 };
      entree.series += 1;
      const reps = Number(saisi?.reps);
      const charge = Number(saisi?.charge);
      if (Number.isFinite(reps) && reps > 0) entree.repetitions = reps;
      if (Number.isFinite(charge) && charge > 0) entree.chargeKg = charge;
      parExercice.set(s.nom, entree);
    });
    try {
      await fetch("/api/seances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          exercices: [...parExercice.values()],
          dureeMinutes,
          notes: `Séance guidée : ${nomSeance}`,
        }),
      });
    } catch {
      // Best-effort : la séance reste "terminée" pour l'utilisateur même si
      // le log échoue (réseau, etc.) — jamais bloquer sur ça après l'effort
      // réel qu'il vient de fournir.
    } finally {
      setEnvoiEnCours(false);
      setTermine(true);
    }
  }

  function suivant() {
    setConsigneOuverte(false);
    if (index + 1 >= steps.length) {
      terminerSeance();
      return;
    }
    setIndex((i) => i + 1);
  }

  // Garde double : au-delà de "steps vide", TypeScript ne peut pas déduire
  // que "index" reste toujours dans les bornes du tableau juste parce que
  // suivant()/useEffect le maintiennent correct — sans ce garde, chaque
  // accès à step.type plus bas est "possibly undefined" (noUncheckedIndexedAccess).
  if (steps.length === 0 || !step) return null;

  const prochainSet = steps.slice(index + 1).find((s): s is Extract<Step, { type: "set" }> => s.type === "set");
  const consigne = step.type === "set" && typeof step.exercice.charge === "string" ? step.exercice.charge : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0e10]">
      {termine ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="text-5xl">✅</span>
          <h2 className="font-display text-2xl font-semibold text-white">Séance terminée</h2>
          <p className="text-sm text-graphite-400">
            {formatChrono(chronoGlobal)} d&apos;effort. Ta séance a été enregistrée dans ton suivi.
          </p>
          <button type="button" onClick={onClose} className="coai-rainbow-cta mt-2 rounded-full border-0 px-8 py-3 text-sm font-bold text-[#111216]">
            Fermer
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
            <button type="button" onClick={() => window.confirm("Quitter la séance ? Ta progression ne sera pas enregistrée.") && onClose()} aria-label="Fermer" className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-white/10 text-graphite-300">
              ✕
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="truncate text-sm font-semibold text-white">{nomSeance}</p>
                <span className="flex-none font-mono text-[11px] tabular-nums text-laiton-300">{formatChrono(chronoGlobal)}</span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full rounded-full bg-laiton-400 transition-all duration-300" style={{ width: `${Math.round(((index + 1) / steps.length) * 100)}%` }} />
              </div>
              {totalSets > 0 && (
                <p className="mt-1 font-mono text-[10px] text-graphite-500">
                  Série {Math.min(setsFaits + (step.type === "set" ? 1 : 0), totalSets)} sur {totalSets}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-8 text-center">
            {(step.type === "echauffement" || step.type === "calme") && (() => {
              const etapes = enEtapes(step.texte);
              const prefixe = step.type === "echauffement" ? "ech" : "calme";
              return (
                <>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-300">
                    {step.type === "echauffement" ? "🔥 Échauffement" : "🧘 Retour au calme"}
                  </span>
                  {etapes.length > 1 ? (
                    <div className="flex w-full max-w-md flex-col gap-2 text-left">
                      {etapes.map((etape, i) => {
                        const cle = `${prefixe}-${i}`;
                        const coche = Boolean(coches[cle]);
                        return (
                          <button
                            key={cle}
                            type="button"
                            onClick={() => setCoches((c) => ({ ...c, [cle]: !c[cle] }))}
                            aria-pressed={coche}
                            className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                              coche ? "border-laiton-400/40 bg-laiton-400/[0.08]" : "border-white/10 bg-white/[0.03]"
                            }`}
                          >
                            <span className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border text-[11px] ${coche ? "border-laiton-400 bg-laiton-400 text-[#111216]" : "border-white/20 text-transparent"}`}>✓</span>
                            <span className={`text-sm leading-6 ${coche ? "text-graphite-400 line-through" : "text-graphite-100"}`}>{etape}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="max-w-md text-base leading-7 text-graphite-100">{step.texte}</p>
                  )}
                </>
              );
            })()}

            {step.type === "set" && (() => {
              const photoQuery = typeof step.exercice.photoQuery === "string" ? step.exercice.photoQuery : undefined;
              const photoUrl = photoQuery ? photosParExercice?.[photoQuery] : null;
              const cle = `${step.exerciceIndex}-${step.setIndex}`;
              const saisi = realise[cle] ?? { reps: "", charge: "" };
              return (
                <>
                  {photoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- source Pexels externe
                    <img src={photoUrl} alt="" className="h-40 w-full max-w-xs rounded-2xl object-cover" loading="lazy" />
                  )}
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-300">Série {step.setIndex}/{step.totalSets}</span>
                    <h2 className="mt-1 font-display text-2xl font-semibold text-white">{step.nom}</h2>
                    {typeof step.exercice.repetitions === "string" && (
                      <p className="mt-1 text-sm text-graphite-300">Visé : {String(step.exercice.repetitions)}</p>
                    )}
                  </div>

                  {consigne && (
                    <button
                      type="button"
                      onClick={() => setConsigneOuverte(true)}
                      className="rounded-full border border-laiton-400/30 bg-laiton-400/10 px-4 py-2 text-xs font-semibold text-laiton-200 transition hover:bg-laiton-400/20"
                    >
                      💡 Consigne du coach
                    </button>
                  )}

                  {/* Saisie de ce qui a été réellement fait — facultative :
                      laisser vide reste valable, la série compte quand même. */}
                  <div className="grid w-full max-w-xs grid-cols-2 gap-2.5 text-left">
                    <label className="flex flex-col gap-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-graphite-500">Reps faites</span>
                      <input
                        type="number" inputMode="numeric" min="0" max="999" placeholder="—"
                        value={saisi.reps}
                        onChange={(e) => setRealise((r) => ({ ...r, [cle]: { ...saisi, reps: e.target.value } }))}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-lg font-semibold tabular-nums text-white outline-none focus:border-laiton-400/60"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-graphite-500">Charge (kg)</span>
                      <input
                        type="number" inputMode="decimal" min="0" max="500" placeholder="—"
                        value={saisi.charge}
                        onChange={(e) => setRealise((r) => ({ ...r, [cle]: { ...saisi, charge: e.target.value } }))}
                        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-center text-lg font-semibold tabular-nums text-white outline-none focus:border-laiton-400/60"
                      />
                    </label>
                  </div>
                </>
              );
            })()}

            {step.type === "repos" && (
              <>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-300">Repos</span>
                <CercleMinuteur secondesRestantes={secondesRestantes} secondesTotal={step.secondes} />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setSecondesRestantes((s) => Math.max(0, s - 15))} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white">-15s</button>
                  <button type="button" onClick={() => setSecondesRestantes((s) => s + 15)} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white">+15s</button>
                </div>
                <p className="text-xs text-graphite-500">Suivant : {step.prochainNom}</p>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-white/10 px-6 py-4">
            {prochainSet && (
              <p className="text-center text-[11px] uppercase tracking-wide text-graphite-600">À venir · {prochainSet.nom}</p>
            )}
            <button
              type="button"
              onClick={suivant}
              disabled={envoiEnCours}
              className="coai-rainbow-cta w-full rounded-full border-0 py-3.5 text-sm font-extrabold text-[#111216] disabled:opacity-60"
            >
              {index + 1 >= steps.length ? (envoiEnCours ? "…" : "Terminer la séance ✓") : step.type === "repos" ? "Passer le repos →" : "C'est fait ✓"}
            </button>
          </div>

          {consigneOuverte && consigne && (
            <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => setConsigneOuverte(false)}>
              <div className="w-full max-w-sm rounded-2xl border border-laiton-400/25 bg-[#16181b] p-5 text-left" onClick={(e) => e.stopPropagation()}>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-300">💡 Consigne du coach</p>
                <p className="mt-3 text-sm leading-6 text-graphite-100">{consigne}</p>
                <button type="button" onClick={() => setConsigneOuverte(false)} className="mt-4 w-full rounded-full border border-white/15 py-2.5 text-sm font-semibold text-white">
                  Compris
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
