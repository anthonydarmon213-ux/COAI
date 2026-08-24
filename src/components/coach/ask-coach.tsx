"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
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

  // Raccourcis de réponses rapides (21/08/2026, demande Anthony) —
  // pré-remplissent le champ au lieu d'envoyer directement : la personne
  // peut préciser sa situation avant d'envoyer, ce qui donne une bien
  // meilleure réponse qu'une question générique.
  const RACCOURCIS = [
    { label: "Ajuster mes charges", texte: "Je voudrais ajuster mes charges, elles me semblent" },
    { label: "Adapter ma semaine", texte: "Je me sens fatigué(e) en ce moment, comment adapter ma semaine ?" },
    { label: "Changer un exercice", texte: "Je n'ai pas le matériel prévu aujourd'hui, par quoi remplacer" },
    { label: "Signaler une gêne", texte: "J'ai une gêne quelque part, que faire pour ma prochaine séance ?" },
  ];

  return (
    <div className="relative flex flex-col overflow-hidden rounded-[1.75rem] border border-cyan-300/15 bg-[radial-gradient(circle_at_90%_0%,rgba(76,201,240,.12),transparent_22rem),linear-gradient(145deg,rgba(255,255,255,.05),rgba(255,255,255,.015))] shadow-[0_35px_90px_-55px_rgba(76,201,240,.65),inset_0_1px_rgba(255,255,255,.08)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(76,201,240,.3)_1px,transparent_1px),linear-gradient(90deg,rgba(76,201,240,.3)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="relative flex items-center gap-3 border-b border-white/10 bg-black/20 px-5 py-4">
        <div className="relative h-10 w-10 flex-none overflow-hidden rounded-full border border-laiton-400/40">
          <Image src="/coach-ia-anthony.png" alt="" fill sizes="2.5rem" className="object-cover object-[50%_22%]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">Coach COAI · Anthony</p>
          <p className="text-[11px] text-cyan-200/70">{loading ? "analyse ton contexte…" : "prêt à t’accompagner"}</p>
        </div>
        {quotaRemaining !== null && (
          <span className="flex-none rounded-full border border-laiton-400/25 bg-laiton-400/10 px-2.5 py-1 text-[10px] font-semibold text-laiton-200">
            {quotaRemaining} restante{quotaRemaining > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Fil de conversation en bulles — le plus ancien en haut, comme
          dans une vraie messagerie (l'historique était affiché à l'envers
          jusqu'ici, ce qui cassait la lecture d'un échange suivi). */}
      <div className="relative flex min-h-[16rem] flex-col gap-3 px-5 py-5 sm:min-h-[19rem]">
        {historique.length === 0 && !loading && (
          <div className="my-auto text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.08] text-xl text-cyan-200 shadow-[0_0_30px_-8px_rgba(76,201,240,.75)]">✦</span>
            <p className="mt-4 text-sm font-semibold text-white">Comment puis-je t&apos;aider aujourd&apos;hui ?</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-graphite-400">Technique, progression des charges, fatigue ou adaptation de séance.</p>
          </div>
        )}
        {historique.map((echange, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-laiton-400/90 px-3.5 py-2.5 text-sm leading-6 text-[#111216]">
                {echange.question}
              </p>
            </div>
            <div className="flex justify-start">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm leading-6 text-graphite-100">
                {echange.reponse}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <span className="rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-graphite-400">
              <span className="inline-flex gap-1" aria-label="Le coach écrit">
                <span className="h-1.5 w-1.5 animate-status-pulse rounded-full bg-laiton-300" />
                <span className="h-1.5 w-1.5 animate-status-pulse rounded-full bg-laiton-300" style={{ animationDelay: "0.15s" }} />
                <span className="h-1.5 w-1.5 animate-status-pulse rounded-full bg-laiton-300" style={{ animationDelay: "0.3s" }} />
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="relative border-t border-white/10 bg-black/20 px-4 py-4 sm:px-5">
        <div className="mb-3 grid grid-cols-2 gap-2">
          {RACCOURCIS.map(({ label, texte }) => (
            <button
              key={label}
              type="button"
              onClick={() => setQuestion(texte)}
              className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-[11px] font-semibold text-graphite-200 transition hover:border-cyan-300/35 hover:bg-cyan-300/[0.07] hover:text-white"
            >
              <span className="mr-1 text-cyan-200">↗</span> {label}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Écris ton message…"
            rows={1}
            maxLength={1000}
            className="max-h-32 min-h-[3rem] w-full flex-1 resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-graphite-50 placeholder:text-graphite-500 focus:border-cyan-300/45 focus:outline-none focus:shadow-[0_0_24px_-10px_rgba(76,201,240,.7)]"
          />
          <Button type="submit" disabled={loading || !question.trim()} className="h-11 flex-none rounded-full px-5">
            {loading ? "…" : "Envoyer"}
          </Button>
        </form>
        {loading && (
          <div className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div className="h-full rounded-full bg-laiton-400 transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        )}
        {error && (
          <div className="mt-3 flex flex-col items-center gap-2">
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
      </div>
    </div>
  );
}
