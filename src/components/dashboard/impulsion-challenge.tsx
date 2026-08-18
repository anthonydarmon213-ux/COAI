"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY_PREFIX = "coai_defi_7_jours_v1_";

const JOURS = [
  { titre: "Clarifie ton point de départ", texte: "Vérifie les repères essentiels que COAI utilisera pour personnaliser la suite.", action: "Vérifier mon profil", href: "/compte/profil?onboarding=1" },
  { titre: "Observe ta vraie journée", texte: "Renseigne ton activité du jour pour que COAI parte de ta réalité, pas d’une moyenne générique.", action: "Noter mon activité", href: "/dashboard#activite-quotidienne" },
  { titre: "Améliore un repas", texte: "Choisis un seul ajustement nutritionnel simple et applicable aujourd’hui.", action: "Voir mes repères nutrition", href: "/programme/alimentation" },
  { titre: "Prépare ta récupération", texte: "Identifie l’action qui aura le plus d’impact sur ton sommeil ou ton énergie demain.", action: "Voir ma récupération", href: "/programme/recuperation" },
  { titre: "Pose une vraie question", texte: "Demande au Coach IA comment adapter ton entraînement à une contrainte concrète de ta semaine.", action: "Parler au Coach IA", href: "/coach" },
  { titre: "Mesure ton premier repère", texte: "Enregistre une donnée simple pour pouvoir observer une progression réelle dans le temps.", action: "Ajouter une mesure", href: "/suivi/mesures" },
  { titre: "Choisis la suite", texte: "Fais le point sur ce que COAI a déjà compris de toi et choisis le niveau d’accompagnement utile.", action: "Découvrir mon accompagnement", href: "/pricing" },
] as const;

export function ImpulsionChallenge({ createdAt, userId }: { createdAt: string; userId: string }) {
  const [completed, setCompleted] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  const unlockedDay = useMemo(() => {
    const elapsed = Date.now() - new Date(createdAt).getTime();
    return Math.max(1, Math.min(7, Math.floor(elapsed / 86_400_000) + 1));
  }, [createdAt]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`) ?? "[]");
      if (Array.isArray(saved)) setCompleted(saved.filter((value): value is number => Number.isInteger(value) && value >= 1 && value <= 7));
    } catch {
      // Une valeur locale invalide ne doit jamais masquer le défi.
    } finally {
      setLoaded(true);
    }
  }, [userId]);

  function toggleDay(day: number) {
    const next = completed.includes(day) ? completed.filter((value) => value !== day) : [...completed, day];
    setCompleted(next);
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(next));
    if (!completed.includes(day)) {
      trackEvent(day === 7 ? "challenge_completed" : "challenge_day_completed", { day, challenge: "coai_7_days" });
    }
  }

  if (!loaded) return null;

  // Toujours proposer la première étape disponible non terminée. Sinon une
  // personne qui revient quatre jours après son inscription tombe directement
  // sur l'étape 4 sans avoir vu les trois premières, ce qui rend le parcours
  // incompréhensible.
  const firstIncompleteDay = JOURS.findIndex((_, index) => index + 1 <= unlockedDay && !completed.includes(index + 1));
  const currentDay = firstIncompleteDay >= 0 ? firstIncompleteDay + 1 : unlockedDay;
  const current = JOURS[currentDay - 1] ?? JOURS[0];
  const progress = Math.round((completed.length / 7) * 100);

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-laiton-400/30 bg-[linear-gradient(145deg,rgba(239,217,173,.16),rgba(255,255,255,.035))] p-6 shadow-[0_26px_80px_-45px_rgba(201,162,98,.75)] sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-laiton-300">Défi COAI · 7 jours</p>
          <h2 className="mt-2 font-editorial text-3xl text-white">Découvre comment COAI apprend de toi.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-300">Une seule action utile par jour. Pas de programme générique, pas de pression inutile.</p>
        </div>
        <span className="shrink-0 rounded-full border border-laiton-400/25 bg-laiton-400/10 px-4 py-2 text-sm font-bold text-laiton-200">{completed.length}/7 terminé</span>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.07]" aria-label={`Progression ${progress} %`}>
        <div className="h-full rounded-full bg-gradient-to-r from-laiton-500 to-laiton-200 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#101211]/80 p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-laiton-300">Étape {currentDay} sur 7 · à faire maintenant</p>
        <h3 className="mt-2 text-xl font-bold text-white">{current.titre}</h3>
        <p className="mt-2 text-sm leading-6 text-graphite-300">{current.texte}</p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link href={current.href} onClick={() => trackEvent("challenge_started", { day: currentDay, challenge: "coai_7_days" })} className="coai-rainbow-cta inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-extrabold text-[#111216]">{current.action} →</Link>
          <button type="button" onClick={() => toggleDay(currentDay)} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-semibold text-graphite-200 transition hover:bg-white/[0.06]">{completed.includes(currentDay) ? "Annuler" : "Marquer comme fait"}</button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-graphite-300">Les 7 étapes du défi</p>
        <p className="text-right text-[11px] text-graphite-500">Une étape se débloque chaque jour</p>
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1.5" aria-label="Les sept étapes du défi">
        {JOURS.map((jour, index) => {
          const day = index + 1;
          const locked = day > unlockedDay;
          const done = completed.includes(day);
          const currentStep = day === currentDay;
          return <div key={jour.titre} title={locked ? `Étape ${day} disponible plus tard` : jour.titre} aria-current={currentStep ? "step" : undefined} className={`flex h-9 items-center justify-center rounded-lg border text-xs font-bold ${done ? "border-emerald-500/35 bg-emerald-500/15 text-emerald-200" : currentStep ? "border-laiton-300 bg-laiton-300/20 text-white ring-2 ring-laiton-300/25" : locked ? "border-white/[0.04] bg-white/[0.02] text-graphite-700" : "border-laiton-400/25 bg-laiton-400/[0.07] text-laiton-200"}`}>{done ? "✓" : day}</div>;
        })}
      </div>
      <p className="mt-2 text-[11px] leading-5 text-graphite-500">Ces numéros représentent les étapes de ton défi, pas les dates du calendrier affiché plus bas.</p>
    </section>
  );
}
