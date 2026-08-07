"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Echange = { question: string; reponse: string };

export function AskCoach() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historique, setHistorique] = useState<Echange[]>([]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Impossible d'obtenir une réponse.");
      setHistorique((prev) => [...prev, { question: q, reponse: data.answer }]);
      setQuestion("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col items-center gap-5 py-10 text-center">
        <div className={`coai-coach-aura ${loading ? "is-thinking animate-pulse-glow" : ""}`} aria-hidden="true" />
        <p className="font-mono text-xs uppercase tracking-widest text-graphite-400">
          {loading ? "Ton coach réfléchit…" : "Prêt à répondre"}
        </p>
        <form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col gap-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex : Je peux remplacer le squat par quoi si je n'ai pas de barre ?"
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-lg border border-graphite-700 bg-graphite-900/60 px-4 py-3 text-sm text-graphite-50 placeholder:text-graphite-600 focus:border-laiton-400/50 focus:outline-none"
          />
          <Button type="submit" disabled={loading || !question.trim()} className="self-center px-7">
            {loading ? "Envoi…" : "Poser la question"}
          </Button>
        </form>
        {error && <p className="text-sm text-red-400">{error}</p>}
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
