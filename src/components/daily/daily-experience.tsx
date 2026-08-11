"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Session = Record<string, unknown> & {
  nom?: string;
  echauffement?: string;
  exercices?: Record<string, unknown>[];
  retourAuCalme?: string;
};

type Adaptation = {
  adapted: boolean;
  title: string;
  reason: string;
  changes: string[];
  originalExerciseCount: number;
  adaptedExerciseCount: number;
};

type Daily = {
  adaptedSession: unknown;
  adaptation: unknown;
  sleep: string | null;
  energy: string | null;
  pain: boolean | null;
  painArea: string | null;
  availableMinutes: number | null;
  completedAt: string | Date | null;
  workoutRating: string | null;
} | null;

const SLEEP = [
  ["TRES_MAUVAIS", "Très mauvais"], ["MAUVAIS", "Mauvais"], ["CORRECT", "Correct"],
  ["BON", "Bon"], ["EXCELLENT", "Excellent"],
] as const;
const ENERGY = [
  ["TRES_BASSE", "Très basse"], ["BASSE", "Basse"], ["NORMALE", "Normale"],
  ["HAUTE", "Haute"], ["TRES_HAUTE", "Très haute"],
] as const;
const TIMES = [[15, "15 min"], [25, "25 min"], [40, "40 min"], [60, "60 min"], [75, "60+ min"]] as const;
const FEEDBACK = [["TROP_FACILE", "Trop facile"], ["BIEN_DOSEE", "Bien dosée"], ["TROP_DURE", "Trop dure"]] as const;
const AREAS = ["Dos", "Épaule", "Genou", "Cheville", "Poignet", "Hanche", "Cou", "Autre"];

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-10 rounded-full border px-3 py-2 text-xs transition ${active ? "border-laiton-400/60 bg-laiton-400/15 text-laiton-200" : "border-white/10 bg-white/[0.025] text-graphite-300 hover:border-white/25 hover:text-white"}`}>
      {children}
    </button>
  );
}

function Exercise({ data, index }: { data: Record<string, unknown>; index: number }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-laiton-400/25 font-mono text-[10px] text-laiton-300">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-white">{String(data.nom ?? `Exercice ${index + 1}`)}</h4>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-graphite-400">
            {data.series != null && <span>{String(data.series)} séries</span>}
            {data.repetitions != null && <span>{String(data.repetitions)}</span>}
            {data.repos != null && <span>Repos {String(data.repos)}</span>}
          </div>
          {data.charge != null && <p className="mt-2 text-xs leading-5 text-graphite-300">{String(data.charge)}</p>}
        </div>
      </div>
    </div>
  );
}

export function DailyExperience({
  sourceSession,
  initialDaily,
  expectedMinutes,
  pendingCoach,
  programmeVersion,
}: {
  sourceSession: Session;
  initialDaily: Daily;
  expectedMinutes: number;
  pendingCoach: boolean;
  programmeVersion: number;
}) {
  const router = useRouter();
  const defaultTime = expectedMinutes <= 15 ? 15 : expectedMinutes <= 25 ? 25 : expectedMinutes <= 40 ? 40 : expectedMinutes <= 60 ? 60 : 75;
  const [daily, setDaily] = useState<Daily>(initialDaily);
  const [sleep, setSleep] = useState(initialDaily?.sleep ?? "");
  const [energy, setEnergy] = useState(initialDaily?.energy ?? "");
  const [pain, setPain] = useState(initialDaily?.pain ?? false);
  const [painArea, setPainArea] = useState(initialDaily?.painArea ?? "");
  const [availableMinutes, setAvailableMinutes] = useState(initialDaily?.availableMinutes ?? defaultTime);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedbackOpen, setFeedbackOpen] = useState(Boolean(initialDaily?.completedAt && !initialDaily?.workoutRating));
  const [rating, setRating] = useState("");
  const [feedbackPain, setFeedbackPain] = useState(false);
  const [comment, setComment] = useState("");
  const [started, setStarted] = useState(Boolean(initialDaily?.completedAt));

  const activeSession = (daily?.adaptedSession as Session | null) ?? sourceSession;
  const adaptation = daily?.adaptation as Adaptation | null;
  const exercises = Array.isArray(activeSession.exercices) ? activeSession.exercices : [];
  const checkinDone = Boolean(daily?.sleep);

  async function post(body: Record<string, unknown>) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/daily", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Une erreur est survenue.");
      setDaily(data);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function submitCheckin() {
    if (!sleep || !energy) return setError("Choisis ton sommeil et ton énergie pour continuer.");
    if (pain && !painArea) return setError("Indique simplement la zone gênée.");
    await post({ action: "checkin", sleep, energy, pain, painArea: pain ? painArea : undefined, availableMinutes });
  }

  async function completeWorkout() {
    if (await post({ action: "complete" })) setFeedbackOpen(true);
  }

  async function submitFeedback() {
    if (!rating) return setError("Choisis un ressenti pour terminer.");
    if (await post({ action: "feedback", workoutRating: rating, feedbackPain, feedbackComment: comment || undefined })) {
      setFeedbackOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {pendingCoach && (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-200">
          <strong>À valider par ton coach.</strong> Tu consultes la V{programmeVersion} générée par COAI ; Anthony peut encore l’ajuster.
        </div>
      )}

      {!checkinDone && (
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Check-in · 10 secondes</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Comment tu te sens aujourd’hui ?</h2>
            </div>
            <span className="text-2xl">◎</span>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div><p className="mb-2 text-xs text-graphite-400">Sommeil</p><div className="flex flex-wrap gap-2">{SLEEP.map(([value, label]) => <Chip key={value} active={sleep === value} onClick={() => setSleep(value)}>{label}</Chip>)}</div></div>
            <div><p className="mb-2 text-xs text-graphite-400">Énergie</p><div className="flex flex-wrap gap-2">{ENERGY.map(([value, label]) => <Chip key={value} active={energy === value} onClick={() => setEnergy(value)}>{label}</Chip>)}</div></div>
            <div><p className="mb-2 text-xs text-graphite-400">Temps disponible</p><div className="flex flex-wrap gap-2">{TIMES.map(([value, label]) => <Chip key={value} active={availableMinutes === value} onClick={() => setAvailableMinutes(value)}>{label}</Chip>)}</div></div>
            <div><p className="mb-2 text-xs text-graphite-400">Douleur ou gêne</p><div className="flex gap-2"><Chip active={!pain} onClick={() => { setPain(false); setPainArea(""); }}>Aucune</Chip><Chip active={pain} onClick={() => setPain(true)}>Oui</Chip></div>{pain && <div className="mt-2 flex flex-wrap gap-2">{AREAS.map((area) => <Chip key={area} active={painArea === area} onClick={() => setPainArea(area)}>{area}</Chip>)}</div>}</div>
          </div>
          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          <Button onClick={submitCheckin} disabled={loading} className="mt-5 w-full sm:w-auto">{loading ? "Adaptation…" : "Voir ma séance du jour"}</Button>
        </section>
      )}

      {adaptation?.adapted && (
        <section className="rounded-2xl border border-laiton-400/30 bg-gradient-to-br from-laiton-400/[0.12] to-transparent p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">{adaptation.title}</p>
          <h3 className="mt-2 text-lg text-white">Pourquoi ?</h3>
          <p className="mt-1 text-sm leading-6 text-graphite-200">{adaptation.reason}</p>
          {adaptation.changes.length > 0 && <ul className="mt-3 space-y-1 text-xs text-graphite-300">{adaptation.changes.map((change) => <li key={change}>✓ {change}</li>)}</ul>}
        </section>
      )}

      <section className="relative overflow-hidden rounded-3xl border border-laiton-400/25 bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-laiton-400/[0.08] p-5 shadow-[0_32px_100px_-50px_rgba(201,162,98,.55)] sm:p-7">
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-laiton-400/10 blur-3xl" />
        <div className="relative">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-laiton-400">Séance du jour</p>
          <h2 className="mt-3 max-w-2xl font-editorial text-3xl text-white sm:text-4xl">{activeSession.nom ?? "Ta séance personnalisée"}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-graphite-200">{daily?.availableMinutes ?? expectedMinutes} min</span>
            <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-graphite-200">{exercises.length} exercice{exercises.length > 1 ? "s" : ""}</span>
            <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1.5 text-xs text-graphite-200">Programme V{programmeVersion}</span>
          </div>

          {checkinDone && exercises.length > 0 && (
            <div className="mt-6 flex flex-col gap-3">
              {activeSession.echauffement && <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-laiton-300">Échauffement</p><p className="mt-2 text-xs leading-5 text-graphite-300">{activeSession.echauffement}</p></div>}
              {exercises.map((exercise, index) => <Exercise key={index} data={exercise} index={index} />)}
              {activeSession.retourAuCalme && <div className="rounded-xl border border-white/[0.07] bg-black/15 p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-laiton-300">Retour au calme</p><p className="mt-2 text-xs leading-5 text-graphite-300">{activeSession.retourAuCalme}</p></div>}
            </div>
          )}

          {checkinDone && !daily?.completedAt && !pain && !started && <Button onClick={() => setStarted(true)} className="mt-6 w-full">Commencer ma séance</Button>}
          {checkinDone && !daily?.completedAt && !pain && started && <Button onClick={completeWorkout} disabled={loading} className="mt-6 w-full">{loading ? "Enregistrement…" : "Terminer ma séance"}</Button>}
          {checkinDone && pain && <p className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm leading-6 text-amber-100">Ne t’entraîne pas à travers une douleur. Si elle persiste, s’intensifie ou t’inquiète, demande l’avis d’un professionnel de santé.</p>}
          {!checkinDone && <p className="mt-6 text-sm text-graphite-400">Complète le check-in pour afficher le détail et confirmer l’adaptation.</p>}
        </div>
      </section>

      {feedbackOpen && (
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Après la séance</p>
          <h2 className="mt-2 text-xl text-white">Comment était ta séance ?</h2>
          <div className="mt-4 flex flex-wrap gap-2">{FEEDBACK.map(([value, label]) => <Chip key={value} active={rating === value} onClick={() => setRating(value)}>{label}</Chip>)}</div>
          <p className="mb-2 mt-5 text-xs text-graphite-400">Une douleur ou gêne ?</p><div className="flex gap-2"><Chip active={!feedbackPain} onClick={() => setFeedbackPain(false)}>Non</Chip><Chip active={feedbackPain} onClick={() => setFeedbackPain(true)}>Oui</Chip></div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Un commentaire ? (facultatif)" className="mt-4 min-h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white outline-none focus:border-laiton-400/40" />
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <Button onClick={submitFeedback} disabled={loading} className="mt-4 w-full sm:w-auto">{loading ? "Enregistrement…" : "Enregistrer mon ressenti"}</Button>
        </section>
      )}

      {daily?.workoutRating && <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-200">Séance et ressenti enregistrés. COAI conservera ce signal pour les prochaines adaptations.</p>}
    </div>
  );
}
