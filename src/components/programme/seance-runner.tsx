"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { voixDisponible, lirePreferenceVoix, ecrirePreferenceVoix, parler, stopperVoix } from "@/lib/voice/speech";
import { MuscleMap } from "@/components/programme/muscle-map";
import { musclesPourExercice, estPolyarticulaire } from "@/lib/exercices/muscles";
import { photoCoaiPourNom } from "@/lib/exercices/photos-coai";
import { CoaiImageMark } from "@/components/ui/coai-image-mark";
import { MotionCheck } from "@/components/programme/motion-check";
import { variantesPourExercice } from "@/lib/exercices/variantes";

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

// Substitutions "matériel indisponible" — table partagée dans
// lib/exercices/variantes.ts (23/08/2026) : elle vivait ici en dur avec
// une seule variante par mouvement, donc inutilisable sur la fiche
// d'exercice. Deux tables auraient forcément divergé.
function trouverVariante(nom: string): { variante: string; consigne: string } | null {
  const alternatives = variantesPourExercice(nom);
  // Le lecteur en pleine séance n'affiche qu'UNE alternative : au milieu
  // d'une série, un choix entre trois options est une friction, pas un
  // service. Le poids du corps est privilégié — c'est l'option toujours
  // disponible, quel que soit ce qui manque.
  const preferee = alternatives.find((v) => v.materiel === "poids_du_corps") ?? alternatives[0];
  return preferee ? { variante: preferee.nom, consigne: preferee.consigne } : null;
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

// Saisie vocale (22/08/2026, demande Anthony) — en salle, les mains sont
// souvent occupées ou moites. Utilise la Web Speech API du navigateur
// (aucune dépendance, aucun envoi audio à un serveur). Indisponible sur
// Firefox et sur certains navigateurs : le bouton ne s'affiche alors pas
// du tout, plutôt qu'un bouton mort qui ne réagit jamais.
type ReconnaissanceVocale = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function creerReconnaissance(): ReconnaissanceVocale | null {
  if (typeof window === "undefined") return null;
  type AvecSpeech = typeof window & {
    SpeechRecognition?: new () => ReconnaissanceVocale;
    webkitSpeechRecognition?: new () => ReconnaissanceVocale;
  };
  const w = window as AvecSpeech;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const instance = new Ctor();
  instance.lang = "fr-FR";
  instance.continuous = false;
  instance.interimResults = false;
  return instance;
}

// Extrait reps et charge d'une phrase dictée. Accepte les formulations
// naturelles ("douze à quarante kilos", "10 reps 50"). Si un seul nombre
// est dicté, il est traité comme les répétitions — le cas le plus fréquent,
// et la charge reste modifiable à la main.
function analyserDictee(texte: string): { reps?: string; charge?: string } {
  const t = texte.toLowerCase();
  const nombres = t.match(/\d+([.,]\d+)?/g)?.map((n) => n.replace(",", ".")) ?? [];
  if (nombres.length === 0) return {};

  // Une unité de poids explicite lève toute ambiguïté.
  const avecKilo = t.match(/(\d+([.,]\d+)?)\s*(kg|kilo)/);
  if (avecKilo?.[1]) {
    const charge = avecKilo[1].replace(",", ".");
    const reps = nombres.find((n) => n !== charge);
    return { charge, ...(reps ? { reps } : {}) };
  }
  if (nombres.length === 1) return { reps: nombres[0] };
  return { reps: nombres[0], charge: nombres[1] };
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
  // Ajustements en direct (22/08/2026, demande Anthony) — appliqués
  // uniquement à la séance en cours, jamais écrits dans le programme
  // généré : c'est un dépannage du jour, pas une modification du plan.
  const [ajustementOuvert, setAjustementOuvert] = useState(false);
  const [substitutions, setSubstitutions] = useState<Record<string, { variante: string; consigne: string }>>({});
  const [seanceCondensee, setSeanceCondensee] = useState(false);
  const [dicteeActive, setDicteeActive] = useState(false);
  // Résolu une seule fois : la disponibilité de la Web Speech API ne change
  // pas pendant la séance, et instancier à chaque rendu créerait des objets
  // de reconnaissance orphelins.
  const [vocalDisponible] = useState(() => creerReconnaissance() !== null);
  // Voice Coach (22/08/2026) — opt-in, jamais activé d'office.
  const [voixActive, setVoixActive] = useState(false);
  const [voixSupportee] = useState(() => voixDisponible());
  const [coachParle, setCoachParle] = useState(false);
  const [questionEnCours, setQuestionEnCours] = useState(false);
  const [reponseCoach, setReponseCoach] = useState<string | null>(null);

  // La préférence n'est lue qu'au montage côté client : la lire pendant le
  // rendu provoquerait une différence entre serveur et client.
  useEffect(() => {
    setVoixActive(lirePreferenceVoix());
    return () => stopperVoix();
  }, []);

  const tousLesSteps = useMemo(() => buildSteps(echauffement, exercices, retourAuCalme), [echauffement, exercices, retourAuCalme]);
  // "Pressé par le temps" : garde le premier exercice (le plus lourd, placé
  // en tête par le générateur) plus un sur deux ensuite, avec un plancher à
  // deux exercices — en dessous ce n'est plus une séance.
  const steps = useMemo(() => {
    if (!seanceCondensee) return tousLesSteps;
    const indexExercices = [...new Set(
      tousLesSteps.filter((s): s is Extract<Step, { type: "set" }> => s.type === "set").map((s) => s.exerciceIndex)
    )];
    const cible = Math.max(2, Math.ceil(indexExercices.length / 2));
    const aGarder = new Set(indexExercices.filter((_, i) => i === 0 || i % 2 === 1).slice(0, cible));
    return tousLesSteps.filter((s) => s.type !== "set" || aGarder.has(s.exerciceIndex));
  }, [tousLesSteps, seanceCondensee]);
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

  // Annonce vocale de l'étape en cours. Interrompt l'annonce précédente :
  // enchaîner vite ne doit pas empiler les phrases.
  useEffect(() => {
    if (!voixActive || !step) return;
    if (step.type === "set") {
      const reps = typeof step.exercice.repetitions === "string" ? `, ${step.exercice.repetitions}` : "";
      parler(`${step.nom}. Série ${step.setIndex} sur ${step.totalSets}${reps}`, { interrompre: true });
    } else if (step.type === "echauffement") {
      parler("Échauffement", { interrompre: true });
    } else if (step.type === "calme") {
      parler("Retour au calme", { interrompre: true });
    }
  }, [index, step, voixActive]);

  // Décompte de fin de repos : 3, 2, 1 puis "c'est parti".
  useEffect(() => {
    if (!voixActive || step?.type !== "repos") return;
    if (secondesRestantes === 3 || secondesRestantes === 2 || secondesRestantes === 1) {
      parler(String(secondesRestantes));
    } else if (secondesRestantes === 0) {
      parler("C'est parti !", { interrompre: true });
    }
  }, [secondesRestantes, step, voixActive]);

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
    type SetDetail = { set: number; reps: number; charge: number };
    const parExercice = new Map<string, { nom: string; series: number; chargeKg?: number; sets: SetDetail[] }>();
    steps.forEach((s, i) => {
      if (s.type !== "set" || i >= index + 1) return;
      const cle = `${s.exerciceIndex}-${s.setIndex}`;
      const saisi = realise[cle];
      const entree = parExercice.get(s.nom) ?? { nom: s.nom, series: 0, sets: [] };
      entree.series += 1;
      const reps = Number(saisi?.reps);
      const charge = Number(saisi?.charge);
      if (Number.isFinite(reps) && reps > 0 && Number.isFinite(charge) && charge >= 0) {
        entree.sets.push({ set: entree.series, reps, charge });
        entree.chargeKg = charge;
      }
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

  // Question au coach pendant la séance (22/08/2026) — dictée, envoyée à
  // /api/coach/ask avec le contexte de l'exercice en cours, réponse lue à
  // voix haute. Le prompt côté serveur reçoit déjà ce contexte (cf.
  // coach-question.ts) : pas de nouvelle route, pas de duplication.
  function poserQuestionAuCoach() {
    const reco = creerReconnaissance();
    if (!reco || questionEnCours) return;
    setQuestionEnCours(true);
    setReponseCoach(null);
    stopperVoix();

    reco.onresult = async (e) => {
      const question = e.results?.[0]?.[0]?.transcript?.trim() ?? "";
      if (!question) {
        setQuestionEnCours(false);
        return;
      }
      try {
        const contexte = step?.type === "set"
          ? {
              sessionName: nomSeance,
              exerciseName: step.nom,
              series: typeof step.exercice.series === "string" ? step.exercice.series : undefined,
              repetitions: typeof step.exercice.repetitions === "string" ? step.exercice.repetitions : undefined,
              rest: typeof step.exercice.repos === "string" ? step.exercice.repos : undefined,
              loadGuidance: typeof step.exercice.charge === "string" ? step.exercice.charge : undefined,
            }
          : { sessionName: nomSeance };

        const res = await fetch("/api/coach/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Contrainte de brièveté portée par la question elle-même : en
            // pleine séance, une réponse longue est inutilisable, et lue à
            // voix haute elle devient interminable.
            question: `${question}\n\n(Réponds en 2 phrases courtes maximum, je suis en pleine séance.)`,
            context: contexte,
          }),
        });
        const data = await res.json().catch(() => null);
        const reponse = typeof data?.answer === "string" ? data.answer : null;
        if (!res.ok || !reponse) {
          const message = typeof data?.error === "string" ? data.error : "Je n'ai pas pu répondre, réessaie.";
          setReponseCoach(message);
          parler(message, { interrompre: true });
          return;
        }
        setReponseCoach(reponse);
        setCoachParle(true);
        parler(reponse, { interrompre: true });
        // Durée approximative de lecture pour éteindre l'onde sonore —
        // l'API ne fournit pas d'événement de fin fiable sur tous les
        // navigateurs.
        window.setTimeout(() => setCoachParle(false), Math.min(20_000, reponse.length * 70));
      } catch {
        setReponseCoach("Connexion impossible pour le moment.");
      } finally {
        setQuestionEnCours(false);
      }
    };
    reco.onerror = () => setQuestionEnCours(false);
    reco.onend = () => setQuestionEnCours(false);
    reco.start();
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-abysse" role="dialog" aria-modal="true" aria-label={`Séance guidée : ${nomSeance}`}>
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
                <span className="flex items-center gap-2">
                  <span className="flex-none font-mono text-[11px] tabular-nums text-laiton-300">{formatChrono(chronoGlobal)}</span>
                  {voixSupportee && (
                    <button
                      type="button"
                      onClick={() => {
                        const suivant = !voixActive;
                        setVoixActive(suivant);
                        ecrirePreferenceVoix(suivant);
                        if (suivant) parler("Voice coach activé");
                      }}
                      aria-pressed={voixActive}
                      title={voixActive ? "Couper la voix du coach" : "Activer la voix du coach"}
                      className={`flex-none rounded-full border px-2.5 py-1 text-[10px] font-semibold transition ${
                        voixActive
                          ? "border-laiton-400 bg-laiton-400/20 text-laiton-100"
                          : "border-white/15 bg-white/[0.04] text-graphite-400 hover:text-white"
                      }`}
                    >
                      {voixActive ? "🔊" : "🔇"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAjustementOuvert(true)}
                    className="flex-none rounded-full border border-laiton-400/30 bg-laiton-400/10 px-2.5 py-1 text-[10px] font-semibold text-laiton-200 transition hover:bg-laiton-400/20"
                  >
                    ⚡️ Ajuster
                  </button>
                </span>
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
              const photoUrl = photoCoaiPourNom(step.nom) ?? (photoQuery ? photosParExercice?.[photoQuery] : null);
              const cle = `${step.exerciceIndex}-${step.setIndex}`;
              const saisi = realise[cle] ?? { reps: "", charge: "" };
              return (
                /* Deux colonnes sur desktop (23/08/2026, signalé par Anthony :
                   "il faut que je déroule beaucoup pour voir les instructions,
                   une en haut, une au milieu, une tout en bas"). Tout était
                   empilé dans une seule colonne centrée : schéma, photo,
                   titre, consigne, saisie — donc l'écran dépassait la hauteur
                   du navigateur en pleine séance, au pire moment pour
                   scroller. Visuels à gauche, actions à droite : la hauteur
                   est divisée par deux.
                   Reste en colonne unique sous lg — sur mobile, deux colonnes
                   rendraient le schéma et les champs de saisie trop étroits. */
                <div className="grid w-full max-w-4xl items-center gap-6 lg:grid-cols-2 lg:gap-8 lg:text-left">
                  <div className="flex flex-col items-center gap-4">
                    {/* Cartographie anatomique (22/08/2026) — ne s'affiche que
                        si l'exercice est reconnu dans la table des muscles :
                        une silhouette éteinte laisserait croire à un bug. */}
                    {(() => {
                      const cible = musclesPourExercice(step.nom);
                      if (!cible) return null;
                      return <MuscleMap activeMuscles={cible.muscles} vue={cible.vue} compact />;
                    })()}

                    {photoUrl && (
                      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl">
                        {/* eslint-disable-next-line @next/next/no-img-element -- cascade visuel COAI puis stock */}
                        <img src={photoUrl} alt={`Position de référence : ${step.nom}`} className="h-52 w-full object-cover object-center" loading="eager" />
                        <CoaiImageMark />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-4 lg:items-start">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-300">Série {step.setIndex}/{step.totalSets}</span>
                    <h2 className="mt-1 font-display text-2xl font-semibold text-white">
                      {substitutions[step.nom]?.variante ?? step.nom}
                    </h2>
                    {substitutions[step.nom] && (
                      <p className="mx-auto mt-1 max-w-xs text-[11px] leading-4 text-laiton-300">
                        Remplace {step.nom} · {substitutions[step.nom]?.consigne}
                      </p>
                    )}
                    {typeof step.exercice.repetitions === "string" && (
                      <p className="mt-1 text-sm text-graphite-300">Visé : {String(step.exercice.repetitions)}</p>
                    )}
                  </div>

                  {estPolyarticulaire(step.nom) && <MotionCheck nomExercice={step.nom} />}

                  {/* La consigne reste derrière un bouton plutôt qu'affichée
                      en clair : c'est une phrase longue (repère de charge
                      généré par l'IA), elle réintroduirait le défilement que
                      cette mise en page vient de supprimer. */}
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
                  {vocalDisponible && (
                    <button
                      type="button"
                      onClick={() => {
                        const reco = creerReconnaissance();
                        if (!reco) return;
                        setDicteeActive(true);
                        reco.onresult = (e) => {
                          const dit = e.results?.[0]?.[0]?.transcript ?? "";
                          const { reps, charge } = analyserDictee(dit);
                          if (reps || charge) {
                            setRealise((r) => ({
                              ...r,
                              [cle]: {
                                reps: reps ?? saisi.reps,
                                charge: charge ?? saisi.charge,
                              },
                            }));
                          }
                        };
                        reco.onerror = () => setDicteeActive(false);
                        reco.onend = () => setDicteeActive(false);
                        reco.start();
                      }}
                      disabled={dicteeActive}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        dicteeActive
                          ? "border-laiton-400 bg-laiton-400/20 text-laiton-100"
                          : "border-white/15 bg-white/[0.04] text-graphite-300 hover:border-laiton-400/40 hover:text-white"
                      }`}
                    >
                      {dicteeActive ? "🎙️ Je t'écoute…" : "🎙️ Dicter mes reps"}
                    </button>
                  )}

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
                  </div>
                </div>
              );
            })()}

            {step.type === "repos" && (
              <>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-300">Repos</span>
                <CercleMinuteur secondesRestantes={secondesRestantes} secondesTotal={step.secondes} />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setSecondesRestantes((s) => Math.max(0, s - 15))} className="min-h-12 rounded-2xl border border-white/15 px-6 text-base font-semibold text-white transition active:scale-95">−15s</button>
                  <button type="button" onClick={() => setSecondesRestantes((s) => s + 15)} className="min-h-12 rounded-2xl border border-white/15 px-6 text-base font-semibold text-white transition active:scale-95">+15s</button>
                </div>
                <p className="text-xs text-graphite-500">Suivant : {step.prochainNom}</p>
              </>
            )}
          </div>

          {/* Onde sonore dorée pendant que le coach parle (22/08/2026) —
              repère visuel utile quand le téléphone est posé au sol. */}
          {coachParle && (
            <div className="flex items-center justify-center gap-1 pb-2" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-laiton-400"
                  style={{
                    height: `${8 + (i % 3) * 6}px`,
                    animation: "coai-onde 0.9s ease-in-out infinite",
                    animationDelay: `${i * 0.12}s`,
                  }}
                />
              ))}
            </div>
          )}

          {reponseCoach && (
            <div className="mx-6 mb-2 rounded-xl border border-laiton-400/25 bg-laiton-400/[0.07] px-3.5 py-2.5">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-laiton-300">Ton coach</p>
              <p className="mt-1 text-xs leading-5 text-graphite-100">{reponseCoach}</p>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-white/10 px-6 py-4">
            {vocalDisponible && (
              <button
                type="button"
                onClick={poserQuestionAuCoach}
                disabled={questionEnCours}
                className={`w-full rounded-full border py-2.5 text-xs font-semibold transition ${
                  questionEnCours
                    ? "border-laiton-400 bg-laiton-400/20 text-laiton-100"
                    : "border-white/15 bg-white/[0.04] text-graphite-300 hover:border-laiton-400/40 hover:text-white"
                }`}
              >
                {questionEnCours ? "🎙️ Je t'écoute…" : "🎙️ Poser une question au coach"}
              </button>
            )}
            {prochainSet && (
              <p className="text-center text-[11px] uppercase tracking-wide text-graphite-600">À venir · {prochainSet.nom}</p>
            )}
            <button
              type="button"
              onClick={suivant}
              disabled={envoiEnCours}
              // Gros poussoir tactile (22/08/2026, demande Anthony) : 64px
              // de haut, bien au-delà des 44px recommandés par Apple —
              // cliquable en pleine série, avec des doigts moites.
              className="coai-rainbow-cta min-h-16 w-full rounded-2xl border-0 text-base font-extrabold text-[#111216] transition active:scale-[0.98] disabled:opacity-60"
            >
              {index + 1 >= steps.length ? (envoiEnCours ? "…" : "Terminer la séance ✓") : step.type === "repos" ? "Passer le repos →" : "C'est fait ✓"}
            </button>
          </div>

          {ajustementOuvert && (
            <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/70 p-4 sm:items-center" onClick={() => setAjustementOuvert(false)}>
              <div className="w-full max-w-sm rounded-2xl border border-laiton-400/25 bg-[#16181b] p-5 text-left" onClick={(e) => e.stopPropagation()}>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-300">⚡️ Ajuster la séance</p>
                <p className="mt-2 text-xs leading-5 text-graphite-400">
                  Valable pour aujourd&apos;hui seulement — ton programme n&apos;est pas modifié.
                </p>

                <div className="mt-4 flex flex-col gap-2.5">
                  {step.type === "set" && (() => {
                    const variante = trouverVariante(step.nom);
                    const dejaRemplace = Boolean(substitutions[step.nom]);
                    if (!variante) {
                      return (
                        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
                          <p className="text-sm font-semibold text-graphite-300">Matériel occupé</p>
                          <p className="mt-1 text-xs leading-5 text-graphite-500">
                            Pas de variante fiable pour « {step.nom} ». Demande-la à ton coach plutôt que d&apos;improviser un mouvement approchant.
                          </p>
                        </div>
                      );
                    }
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setSubstitutions((prev) => {
                            if (!dejaRemplace) return { ...prev, [step.nom]: variante };
                            const copie = { ...prev };
                            delete copie[step.nom];
                            return copie;
                          });
                          setAjustementOuvert(false);
                        }}
                        className={`rounded-xl border px-3.5 py-3 text-left transition ${dejaRemplace ? "border-laiton-400/50 bg-laiton-400/[0.1]" : "border-white/10 bg-white/[0.03] hover:border-laiton-400/30"}`}
                      >
                        <p className="text-sm font-semibold text-white">
                          {dejaRemplace ? "↩︎ Revenir à l'exercice prévu" : "Matériel occupé / indisponible"}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-graphite-400">
                          {dejaRemplace ? `Reprendre ${step.nom}` : `Remplacer par : ${variante.variante}`}
                        </p>
                      </button>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={() => {
                      setSeanceCondensee((v) => !v);
                      setIndex(0);
                      setAjustementOuvert(false);
                    }}
                    className={`rounded-xl border px-3.5 py-3 text-left transition ${seanceCondensee ? "border-laiton-400/50 bg-laiton-400/[0.1]" : "border-white/10 bg-white/[0.03] hover:border-laiton-400/30"}`}
                  >
                    <p className="text-sm font-semibold text-white">
                      {seanceCondensee ? "↩︎ Reprendre la séance complète" : "Pressé(e) par le temps"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-graphite-400">
                      {seanceCondensee ? "Revenir à tous les exercices prévus" : "Garder les exercices clés et réduire le volume"}
                    </p>
                  </button>
                </div>

                <button type="button" onClick={() => setAjustementOuvert(false)} className="mt-4 w-full rounded-full border border-white/15 py-2.5 text-sm font-semibold text-white">
                  Fermer
                </button>
              </div>
            </div>
          )}

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
