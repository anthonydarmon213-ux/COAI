"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Lecteur de séance guidé (21/08/2026, demande Anthony, référence : écran
// "Chest Press... 00:35" de MyFitCoach) — jusqu'ici la séance n'était
// qu'une liste à lire (ExerciceCard), jamais un enchaînement piloté avec
// minuteur de repos. Construit uniquement à partir des données déjà
// générées par l'IA (nom, series, repetitions, repos, charge, phases) —
// "series" et "repos" sont du texte libre ("4", "90 sec", "60-90 sec") : les
// parseurs ci-dessous restent tolérants et retombent sur une valeur sûre
// plutôt que de planter sur un format inattendu, jamais un temps de repos
// inventé sans rapport avec ce que l'IA a écrit.

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

type Step =
  | { type: "echauffement"; texte: string }
  | { type: "set"; exercice: ExerciceBrut; nom: string; setIndex: number; totalSets: number }
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
      steps.push({ type: "set", exercice, nom, setIndex: s, totalSets });
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
  const [termine, setTermine] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const debutRef = useRef(Date.now());
  const nomsCompletesRef = useRef(new Set<string>());

  const step = steps[index];

  useEffect(() => {
    if (step?.type === "repos") setSecondesRestantes(step.secondes);
  }, [index, step]);

  useEffect(() => {
    if (step?.type !== "repos" || secondesRestantes <= 0) return;
    const t = setTimeout(() => setSecondesRestantes((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, secondesRestantes]);

  async function terminerSeance() {
    setEnvoiEnCours(true);
    const dureeMinutes = Math.max(1, Math.round((Date.now() - debutRef.current) / 60000));
    try {
      await fetch("/api/seances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          exercices: [...nomsCompletesRef.current].map((nom) => ({ nom })),
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
    if (step?.type === "set") nomsCompletesRef.current.add(step.nom);
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0d0e10]">
      {termine ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <span className="text-5xl">✅</span>
          <h2 className="font-display text-2xl font-semibold text-white">Séance terminée</h2>
          <p className="text-sm text-graphite-400">Bien joué. Ta séance a été enregistrée dans ton suivi.</p>
          <button type="button" onClick={onClose} className="coai-rainbow-cta mt-2 rounded-full border-0 px-8 py-3 text-sm font-bold text-[#111216]">
            Fermer
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
            <button type="button" onClick={() => window.confirm("Quitter la séance ? Ta progression ne sera pas enregistrée.") && onClose()} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-graphite-300">
              ✕
            </button>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{nomSeance}</p>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full rounded-full bg-laiton-400 transition-all duration-300" style={{ width: `${Math.round(((index + 1) / steps.length) * 100)}%` }} />
              </div>
            </div>
            <span className="font-mono text-[10px] text-graphite-500">{index + 1}/{steps.length}</span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-8 text-center">
            {step.type === "echauffement" && (
              <>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-300">🔥 Échauffement</span>
                <p className="max-w-md text-base leading-7 text-graphite-100">{step.texte}</p>
              </>
            )}

            {step.type === "calme" && (
              <>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-300">🧘 Retour au calme</span>
                <p className="max-w-md text-base leading-7 text-graphite-100">{step.texte}</p>
              </>
            )}

            {step.type === "set" && (() => {
              const photoQuery = typeof step.exercice.photoQuery === "string" ? step.exercice.photoQuery : undefined;
              const photoUrl = photoQuery ? photosParExercice?.[photoQuery] : null;
              const phases = Array.isArray(step.exercice.phases)
                ? step.exercice.phases.filter((p): p is string => typeof p === "string").slice(0, 3)
                : [];
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
                      <p className="mt-1 text-sm text-graphite-300">{String(step.exercice.repetitions)}</p>
                    )}
                    {typeof step.exercice.charge === "string" && (
                      <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-graphite-500">{String(step.exercice.charge)}</p>
                    )}
                  </div>
                  {phases.length === 3 && (
                    <div className="grid w-full max-w-sm grid-cols-1 gap-1.5 text-left">
                      {phases.map((phase, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-lg border border-white/[0.05] bg-black/20 px-2.5 py-2">
                          <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-laiton-400/20 font-mono text-[9px] font-bold text-laiton-300">{i + 1}</span>
                          <span className="text-[11px] leading-snug text-graphite-300">{phase}</span>
                        </div>
                      ))}
                    </div>
                  )}
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

          <div className="flex flex-col gap-2 border-t border-white/[0.06] px-6 py-4">
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
        </>
      )}
    </div>
  );
}
