"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Echange = { question: string; reponse: string };

// Progression simulée pendant l'attente de la réponse IA (pas de vraie
// mesure d'avancement possible côté API) : monte vite au départ, ralentit,
// plafonne à 92% jusqu'à la vraie réponse, puis complète à 100%.
function useSimulatedProgress(active: boolean) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) return;
    setProgress(4);
    const interval = setInterval(() => {
      setProgress((p) => (p >= 92 ? p : p + Math.max(1, Math.round((92 - p) / 8))));
    }, 220);
    return () => clearInterval(interval);
  }, [active]);

  return [progress, setProgress] as const;
}

export function AskCoach({ initialQuotaRemaining }: { initialQuotaRemaining: number | null }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaAtteint, setQuotaAtteint] = useState(false);
  const [historique, setHistorique] = useState<Echange[]>([]);
  const [quotaRemaining, setQuotaRemaining] = useState(initialQuotaRemaining);
  const [progress, setProgress] = useSimulatedProgress(loading);

  const rOuter = 44;
  const circumference = 2 * Math.PI * rOuter;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setQuotaAtteint(false);
    try {
      const res = await fetch("/api/coach/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setQuotaAtteint(true);
          setQuotaRemaining(0);
        }
        throw new Error(data.error ?? "Impossible d'obtenir une réponse.");
      }
      setProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 350));
      setHistorique((prev) => [...prev, { question: q, reponse: data.answer }]);
      if (typeof data.quotaRemaining === "number") setQuotaRemaining(data.quotaRemaining);
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  const dash = (progress / 100) * circumference;

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col items-center gap-5 py-10 text-center">
        <div className="relative flex h-36 w-36 items-center justify-center">
          <div className="relative h-36 w-36 overflow-hidden rounded-full border-2 border-laiton-400/40 shadow-[0_0_32px_-6px_rgba(201,162,98,0.55)]">
            <Image
              src="/coach-ia-anthony.png"
              alt="Anthony Darmon, ton coach IA"
              fill
              sizes="9rem"
              className="coai-coach-photo object-cover object-[50%_22%]"
              priority
            />
          </div>
          {loading && (
            <svg width="144" height="144" viewBox="0 0 120 120" fill="none" className="absolute inset-0" aria-hidden="true">
              <circle cx="60" cy="60" r={rOuter} stroke="#26282d" strokeWidth="6" />
              <circle
                className="coai-loader-arc"
                cx="60"
                cy="60"
                r={rOuter}
                stroke="#c9a262"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 0.2s linear" }}
              />
            </svg>
          )}
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-medium text-graphite-50">
              {progress}%
            </span>
          )}
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-graphite-400">
          {loading ? "Ton coach réfléchit…" : "Prêt à répondre"}
        </p>
        {quotaRemaining !== null && (
          <p className="text-xs text-laiton-300">
            {quotaRemaining} question{quotaRemaining > 1 ? "s" : ""} restante{quotaRemaining > 1 ? "s" : ""} ce mois-ci
          </p>
        )}
        <form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col gap-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex : Je peux remplacer le squat par quoi si je n'ai pas de barre ?"
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-lg border border-graphite-700 bg-graphite-900/60 px-4 py-3 text-sm text-graphite-50 placeholder:text-graphite-500 focus:border-laiton-400/50 focus:outline-none"
          />
          <Button type="submit" disabled={loading || !question.trim()} className="self-center px-7">
            {loading ? "Envoi…" : "Poser la question"}
          </Button>
        </form>
        {error && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-red-400">{error}</p>
            {quotaAtteint && (
              <Link href="/pricing?plan=STANDARD">
                <Button variant="secondary" className="px-6">
                  Découvrir l&apos;accompagnement Coaching Hybride
                </Button>
              </Link>
            )}
          </div>
        )}
      </Card>

      {historique.length > 0 && (
        <div className="flex flex-col gap-4">
          {[...historique].reverse().map((echange, i) => (
            <Card key={i} className="flex flex-col gap-3">
              <p className="text-sm font-medium text-graphite-50">{echange.question}</p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-graphite-300">
                {echange.reponse}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
