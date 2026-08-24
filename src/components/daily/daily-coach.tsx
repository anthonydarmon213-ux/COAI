"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import type { CoachSessionContext } from "@/lib/ai/prompts/coach-question";

type Exchange = { question: string; answer: string };

export function DailyCoach({ context }: { context: CoachSessionContext }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quotaReached, setQuotaReached] = useState(false);
  const [history, setHistory] = useState<Exchange[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const suggestions = context.pain
    ? ["J’ai une gêne, que dois-je faire ?", "Puis-je faire une récupération douce ?"]
    : [
        "Comment bien exécuter cet exercice ?",
        "Quelle charge choisir ?",
        "Par quoi puis-je le remplacer ?",
      ];

  async function ask(event: FormEvent) {
    event.preventDefault();
    const currentQuestion = question.trim();
    if (!currentQuestion || loading) return;
    setLoading(true);
    setError("");
    setQuotaReached(false);
    try {
      const response = await fetch("/api/coach/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion, context }),
      });
      const data = await response.json();
      if (!response.ok) {
        setQuotaReached(response.status === 429);
        throw new Error(typeof data.error === "string" ? data.error : "Le coach ne peut pas répondre pour le moment.");
      }
      setHistory((current) => [...current, { question: currentQuestion, answer: String(data.answer) }]);
      setQuestion("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 flex w-full items-center justify-between gap-4 rounded-2xl border border-laiton-400/25 bg-gradient-to-r from-laiton-400/[0.12] to-white/[0.025] p-4 text-left transition hover:border-laiton-300/45"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-laiton-300/35 bg-laiton-400/10 text-lg text-laiton-200">✦</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-white">Besoin d’aide pendant la séance ?</span>
          <span className="mt-0.5 block text-xs text-graphite-400">Demande au Coach IA avec le contexte de ton exercice</span>
        </span>
        <span className="text-laiton-300" aria-hidden="true">→</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-stretch sm:justify-end" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="daily-coach-title" className="flex max-h-[88dvh] w-full flex-col rounded-t-3xl border border-white/10 bg-graphite-950 shadow-2xl sm:h-full sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-3xl">
            <header className="flex items-center gap-3 border-b border-white/[0.08] p-4 sm:p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-laiton-400/15 text-laiton-200">✦</span>
              <div className="flex-1">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-laiton-400">Coach IA · pendant la séance</p>
                <h2 id="daily-coach-title" className="mt-0.5 text-lg font-semibold text-white">Comment puis-je t’aider ?</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer le Coach IA" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-graphite-300 hover:text-white">×</button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.035] p-3">
                <p className="font-mono text-[9px] uppercase tracking-wider text-graphite-500">Contexte transmis</p>
                <p className="mt-1 text-xs leading-5 text-graphite-200">{context.exerciseName ? `Exercice : ${context.exerciseName}` : `Séance : ${context.sessionName ?? "séance du jour"}`}</p>
                {context.pain && <p className="mt-1 text-xs text-amber-200">Gêne déclarée{context.painArea ? ` : ${context.painArea}` : ""}</p>}
              </div>

              {history.length === 0 && <p className="mt-4 text-sm leading-6 text-graphite-400">Je connais ta séance, ton exercice ouvert et ton bilan du jour. Pose-moi une question précise.</p>}
              <div className="mt-4 flex flex-col gap-4">
                {history.map((exchange, index) => (
                  <div key={`${exchange.question}-${index}`} className="space-y-2">
                    <p className="ml-7 rounded-2xl rounded-br-sm bg-laiton-400 px-4 py-3 text-sm text-graphite-950">{exchange.question}</p>
                    <p className="mr-4 whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm leading-6 text-graphite-200">{exchange.answer}</p>
                  </div>
                ))}
                {loading && <p role="status" className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-graphite-400">Le Coach IA analyse ta séance…</p>}
              </div>
            </div>

            <div className="border-t border-white/[0.08] p-4 sm:p-5">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
                {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => { setQuestion(suggestion); inputRef.current?.focus(); }} className="shrink-0 rounded-full border border-laiton-400/25 px-3 py-2 text-[11px] text-laiton-200 hover:bg-laiton-400/10">{suggestion}</button>)}
              </div>
              <form onSubmit={ask} className="flex items-end gap-2">
                <textarea ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1000} rows={2} placeholder="Pose ta question…" className="min-h-[50px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-graphite-500 focus:border-laiton-400/40" />
                <Button type="submit" size="compact" disabled={loading || !question.trim()} className="h-[50px] px-4">Envoyer</Button>
              </form>
              {error && <p className="mt-2 text-xs text-red-300">{error}{quotaReached ? " Tu peux aussi contacter Anthony depuis l’onglet Coach." : ""}</p>}
              <p className="mt-2 text-[10px] leading-4 text-graphite-600">Le Coach IA conseille, mais ne remplace pas un professionnel de santé.</p>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
