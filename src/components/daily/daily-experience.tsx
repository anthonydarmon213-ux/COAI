"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DailyCoach } from "@/components/daily/daily-coach";
import { ensureWorkoutCompleteness, isCoreExercise } from "@/lib/daily/session";
import { ShareProgressCardButton } from "@/components/suivi/share-progress-card-button";

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
const FOOD = [
  ["PAS_ENCORE", "Pas encore mangé"], ["LEGER", "Plutôt léger"],
  ["EQUILIBRE", "Équilibré"], ["LOURD", "Repas lourd"],
] as const;
const TIMES = [[15, "15 min"], [25, "25 min"], [40, "40 min"], [60, "60 min"], [75, "60+ min"]] as const;
const FEEDBACK = [["TROP_FACILE", "Trop facile"], ["BIEN_DOSEE", "Bien dosée"], ["TROP_DURE", "Trop dure"]] as const;
const AREAS = ["Dos", "Épaule", "Genou", "Cheville", "Poignet", "Hanche", "Cou", "Autre"];

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition ${active ? "border-[#b98b43] bg-[#27241f] text-white shadow-sm" : "border-[#d9d2c4] bg-white/80 text-[#4a4842] hover:border-[#9c7945] hover:bg-white"}`}>
      {children}
    </button>
  );
}

function Exercise({
  data,
  index,
  active,
  done,
  core,
  onOpen,
  onDone,
}: {
  data: Record<string, unknown>;
  index: number;
  active: boolean;
  done: boolean;
  core: boolean;
  onOpen: () => void;
  onDone: () => void;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border transition ${done ? "border-emerald-500/30 bg-emerald-500/[0.05]" : active ? "border-laiton-400/40 bg-laiton-400/[0.06]" : "border-white/[0.07] bg-black/15"}`}>
      <div className="flex items-center gap-3 p-3.5 sm:p-4">
        <button type="button" aria-label={done ? "Marquer comme non fait" : "Marquer comme fait"} onClick={onDone} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs transition ${done ? "border-emerald-400 bg-emerald-400 text-graphite-950" : "border-laiton-400/30 text-laiton-300 hover:border-laiton-300"}`}>
          {done ? "✓" : index + 1}
        </button>
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className={`text-sm font-semibold ${done ? "text-graphite-400 line-through" : "text-white"}`}>{String(data.nom ?? `Exercice ${index + 1}`)}</h4>
            {core && <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-violet-200">Abdos & gainage</span>}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-graphite-400">
            {data.series != null && <span>{String(data.series)} séries</span>}
            {data.repetitions != null && <span>{String(data.repetitions)}</span>}
            {data.repos != null && <span>Repos {String(data.repos)}</span>}
          </div>
        </button>
        <button type="button" aria-label={active ? "Replier l'exercice" : "Afficher les consignes"} onClick={onOpen} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-xs text-graphite-400 transition ${active ? "rotate-180 border-laiton-400/30 text-laiton-300" : ""}`}>⌄</button>
      </div>
      {active && (
        <div className="border-t border-white/[0.07] px-4 py-4 sm:pl-16">
          {data.charge != null && <p className="text-xs leading-5 text-graphite-200"><span className="text-laiton-300">Repère d’effort — </span>{String(data.charge)}</p>}
          {data.methode != null && <p className="mt-2 text-[11px] text-graphite-500">Méthode : {String(data.methode)}</p>}
          <button type="button" onClick={onDone} className={`mt-4 w-full rounded-full border px-4 py-2 text-xs font-semibold transition sm:w-auto ${done ? "border-emerald-500/30 text-emerald-300" : "border-laiton-400/30 text-laiton-200 hover:bg-laiton-400/10"}`}>{done ? "Exercice terminé ✓" : "J’ai terminé cet exercice"}</button>
        </div>
      )}
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
  const [food, setFood] = useState("");
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
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(() => new Set());
  const [activeExercise, setActiveExercise] = useState<number | null>(null);

  const rawSession = (daily?.adaptedSession as Session | null) ?? sourceSession;
  const activeSession = ensureWorkoutCompleteness(rawSession);
  const adaptation = daily?.adaptation as Adaptation | null;
  const exercises = Array.isArray(activeSession.exercices) ? activeSession.exercices : [];
  const mainExercises = exercises.map((exercise, index) => ({ exercise, index })).filter(({ exercise }) => !isCoreExercise(exercise));
  const coreExercises = exercises.map((exercise, index) => ({ exercise, index })).filter(({ exercise }) => isCoreExercise(exercise));
  const checkinDone = Boolean(daily?.sleep);
  const totalSteps = exercises.length + (activeSession.echauffement ? 1 : 0) + (activeSession.retourAuCalme ? 1 : 0);
  const progress = totalSteps > 0 ? Math.round((completedSteps.size / totalSteps) * 100) : 0;
  const focusedExercise = activeExercise == null ? null : exercises[activeExercise];

  function toggleStep(key: string) {
    setCompletedSteps((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function completeExercise(index: number) {
    toggleStep(`exercise-${index}`);
    const next = exercises.findIndex((_, candidate) => candidate > index && !completedSteps.has(`exercise-${candidate}`));
    setActiveExercise(next >= 0 ? next : null);
  }

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
    if (!sleep || !energy || !food) return setError("Réponds aux cinq repères pour adapter ta séance.");
    if (pain && !painArea) return setError("Indique simplement la zone gênée.");
    await post({ action: "checkin", sleep, energy, food, pain, painArea: pain ? painArea : undefined, availableMinutes });
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
        <section className="relative overflow-hidden rounded-[2rem] border border-[#d9c9ac] bg-[linear-gradient(145deg,#fffdf8_0%,#f4eee3_70%,#eef4f3_100%)] p-5 text-[#171713] shadow-[0_30px_90px_-55px_rgba(44,35,22,.55)] sm:p-8">
          <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full border border-[#c9a96b]/25" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9a6d2f]">Embarquement · Aujourd’hui</p>
              <h2 className="mt-3 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">Ta séance s’adapte à ta journée.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#666159]">Comme avec ton coach en face à face : un check-up rapide, puis une séance ajustée à ton objectif et à ton état réel.</p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#c9a96b]/45 bg-white/75 text-xl text-[#9a6d2f]">◎</span>
          </div>
          <div className="mt-7 grid gap-3">
            <div className="rounded-2xl border border-[#ded7cb] bg-white/65 p-4"><p className="mb-3 text-sm font-bold"><span className="mr-2 text-[#a77a38]">01</span> Combien de temps as-tu ?</p><div className="flex flex-wrap gap-2">{TIMES.map(([value, label]) => <Chip key={value} active={availableMinutes === value} onClick={() => setAvailableMinutes(value)}>{label}</Chip>)}</div></div>
            <div className="rounded-2xl border border-[#ded7cb] bg-white/65 p-4"><p className="mb-3 text-sm font-bold"><span className="mr-2 text-[#a77a38]">02</span> Comment est ta forme ?</p><div className="flex flex-wrap gap-2">{ENERGY.map(([value, label]) => <Chip key={value} active={energy === value} onClick={() => setEnergy(value)}>{label}</Chip>)}</div></div>
            <div className="rounded-2xl border border-[#ded7cb] bg-white/65 p-4"><p className="mb-3 text-sm font-bold"><span className="mr-2 text-[#a77a38]">03</span> Comment as-tu dormi ?</p><div className="flex flex-wrap gap-2">{SLEEP.map(([value, label]) => <Chip key={value} active={sleep === value} onClick={() => setSleep(value)}>{label}</Chip>)}</div></div>
            <div className="rounded-2xl border border-[#ded7cb] bg-white/65 p-4"><p className="mb-3 text-sm font-bold"><span className="mr-2 text-[#a77a38]">04</span> Qu’as-tu mangé avant la séance ?</p><div className="flex flex-wrap gap-2">{FOOD.map(([value, label]) => <Chip key={value} active={food === value} onClick={() => setFood(value)}>{label}</Chip>)}</div></div>
            <div className="rounded-2xl border border-[#ded7cb] bg-white/65 p-4"><p className="mb-3 text-sm font-bold"><span className="mr-2 text-[#a77a38]">05</span> Une douleur ou une gêne ?</p><div className="flex gap-2"><Chip active={!pain} onClick={() => { setPain(false); setPainArea(""); }}>Non, tout va bien</Chip><Chip active={pain} onClick={() => setPain(true)}>Oui</Chip></div>{pain && <div className="mt-3 flex flex-wrap gap-2">{AREAS.map((area) => <Chip key={area} active={painArea === area} onClick={() => setPainArea(area)}>{area}</Chip>)}</div>}</div>
          </div>
          {error && <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>}
          <Button onClick={submitCheckin} disabled={loading} className="mt-6 w-full rounded-full bg-[#20211e] py-6 text-base font-bold text-white hover:bg-[#343630] sm:w-auto sm:px-8">{loading ? "COAI adapte ta séance…" : "Adapter ma séance →"}</Button>
        </section>
      )}

      {checkinDone && adaptation && (
        <section className="rounded-2xl border border-[#b8d8cb] bg-[#edf7f2] p-5 text-[#18372d]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#28715c]">✓ Check-in analysé</p>
          <h3 className="mt-2 text-xl font-bold">{adaptation.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#355f52]">{adaptation.reason}</p>
          {adaptation.changes.length > 0 && <ul className="mt-3 space-y-1 text-sm font-medium">{adaptation.changes.map((change) => <li key={change}>✓ {change}</li>)}</ul>}
        </section>
      )}

      {checkinDone && <section className="relative overflow-hidden rounded-3xl border border-laiton-400/25 bg-gradient-to-br from-white/[0.07] via-white/[0.025] to-laiton-400/[0.08] p-5 shadow-[0_32px_100px_-50px_rgba(201,162,98,.55)] sm:p-7">
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
            <div className="mt-6 flex flex-col gap-5">
              <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
                <div className="flex items-end justify-between gap-4">
                  <div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-laiton-400">Progression de la séance</p><p className="mt-1 text-sm text-white">{completedSteps.size} étape{completedSteps.size > 1 ? "s" : ""} sur {totalSteps}</p></div>
                  <span className="font-editorial text-3xl text-laiton-200">{progress}%</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.08]"><div className="h-full rounded-full bg-gradient-to-r from-laiton-500 to-laiton-200 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
                <div className="mt-3 grid grid-cols-4 gap-1.5 text-center font-mono text-[8px] uppercase tracking-wide text-graphite-500"><span>Échauffement</span><span>Renforcement</span><span>Abdos</span><span>Retour au calme</span></div>
              </div>

              {activeSession.echauffement && (
                <details className="group rounded-2xl border border-amber-400/20 bg-amber-400/[0.04]" open={started}>
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-4 marker:content-none">
                    <button type="button" onClick={(event) => { event.preventDefault(); toggleStep("warmup"); }} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${completedSteps.has("warmup") ? "border-emerald-400 bg-emerald-400 text-graphite-950" : "border-amber-400/30 text-amber-200"}`}>{completedSteps.has("warmup") ? "✓" : "↗"}</button>
                    <div className="flex-1"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-amber-200">01 · Échauffement</p><p className="mt-0.5 text-xs text-graphite-400">Prépare ton corps avant les séries de travail</p></div><span className="text-graphite-500 transition group-open:rotate-180">⌄</span>
                  </summary>
                  <div className="border-t border-white/[0.06] px-4 pb-4 pt-3"><p className="text-xs leading-6 text-graphite-200">{activeSession.echauffement}</p><button type="button" onClick={() => toggleStep("warmup")} className="mt-3 rounded-full border border-amber-400/25 px-4 py-2 text-xs text-amber-100">{completedSteps.has("warmup") ? "Échauffement terminé ✓" : "Échauffement terminé"}</button></div>
                </details>
              )}

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-laiton-300">02 · Renforcement principal</p><span className="text-[10px] text-graphite-500">{mainExercises.length} exercices</span></div>
                {mainExercises.map(({ exercise, index }) => <Exercise key={index} data={exercise} index={index} core={false} active={activeExercise === index} done={completedSteps.has(`exercise-${index}`)} onOpen={() => setActiveExercise(activeExercise === index ? null : index)} onDone={() => completeExercise(index)} />)}
              </div>

              {coreExercises.length > 0 && (
                <div className="rounded-2xl border border-violet-400/20 bg-violet-400/[0.035] p-3 sm:p-4">
                  <div className="mb-3 flex items-center justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-violet-200">03 · Finisher abdos & gainage</p><p className="mt-1 text-xs text-graphite-400">Le dernier bloc de ta séance</p></div><span className="text-xl">◉</span></div>
                  <div className="flex flex-col gap-2.5">{coreExercises.map(({ exercise, index }) => <Exercise key={index} data={exercise} index={index} core active={activeExercise === index} done={completedSteps.has(`exercise-${index}`)} onOpen={() => setActiveExercise(activeExercise === index ? null : index)} onDone={() => completeExercise(index)} />)}</div>
                </div>
              )}

              {activeSession.retourAuCalme && (
                <details className="group rounded-2xl border border-sky-400/20 bg-sky-400/[0.035]" open={progress >= 70}>
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-4 marker:content-none"><button type="button" onClick={(event) => { event.preventDefault(); toggleStep("cooldown"); }} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${completedSteps.has("cooldown") ? "border-emerald-400 bg-emerald-400 text-graphite-950" : "border-sky-400/30 text-sky-200"}`}>{completedSteps.has("cooldown") ? "✓" : "↓"}</button><div className="flex-1"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-sky-200">04 · Retour au calme</p><p className="mt-0.5 text-xs text-graphite-400">5 à 8 minutes pour faire redescendre le rythme</p></div><span className="text-graphite-500 transition group-open:rotate-180">⌄</span></summary>
                  <div className="border-t border-white/[0.06] px-4 pb-4 pt-3"><p className="text-xs leading-6 text-graphite-200">{activeSession.retourAuCalme}</p><button type="button" onClick={() => toggleStep("cooldown")} className="mt-3 rounded-full border border-sky-400/25 px-4 py-2 text-xs text-sky-100">{completedSteps.has("cooldown") ? "Retour au calme terminé ✓" : "Retour au calme terminé"}</button></div>
                </details>
              )}
            </div>
          )}

          {checkinDone && !daily?.completedAt && !pain && !started && <Button onClick={() => { setStarted(true); setActiveExercise(0); }} className="mt-6 w-full">Commencer ma séance</Button>}
          {checkinDone && !daily?.completedAt && !pain && started && <Button onClick={completeWorkout} disabled={loading} className="mt-6 w-full">{loading ? "Enregistrement…" : "Terminer ma séance"}</Button>}
          {checkinDone && pain && <p className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4 text-sm leading-6 text-amber-100">Ne t’entraîne pas à travers une douleur. Si elle persiste, s’intensifie ou t’inquiète, demande l’avis d’un professionnel de santé.</p>}
          {checkinDone && (
            <DailyCoach context={{
              source: "DAILY_WORKOUT",
              sessionName: activeSession.nom,
              exerciseName: focusedExercise ? String(focusedExercise.nom ?? "Exercice en cours") : undefined,
              series: focusedExercise?.series == null ? undefined : String(focusedExercise.series),
              repetitions: focusedExercise?.repetitions == null ? undefined : String(focusedExercise.repetitions),
              rest: focusedExercise?.repos == null ? undefined : String(focusedExercise.repos),
              loadGuidance: focusedExercise?.charge == null ? undefined : String(focusedExercise.charge),
              workoutStarted: started,
              sleep: daily?.sleep ?? undefined,
              energy: daily?.energy ?? undefined,
              pain: daily?.pain ?? false,
              painArea: daily?.painArea ?? undefined,
              availableMinutes: daily?.availableMinutes ?? undefined,
              adaptationReason: adaptation?.reason,
              pendingCoach,
            }} />
          )}
        </div>
      </section>}

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

      {daily?.workoutRating && (
        <section className="flex flex-col items-start justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-4 sm:flex-row sm:items-center">
          <div><p className="text-sm font-medium text-emerald-200">Séance accomplie.</p><p className="mt-1 text-xs leading-5 text-graphite-400">Ton ressenti est enregistré pour les prochaines adaptations. Tu peux partager ta régularité sans exposer le détail de ta séance.</p></div>
          <ShareProgressCardButton imageUrl="/api/daily/carte" filename="coai-seance-accomplie.png" title="Séance COAI accomplie" />
        </section>
      )}
    </div>
  );
}
