"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const REASONS = [
  ["PRIX", "Le prix"],
  ["UTILISATION", "Je ne l’utilise pas assez"],
  ["RESULTATS", "Les résultats ne me conviennent pas"],
  ["TECHNIQUE", "Un problème technique"],
  ["COACHING", "Le coaching ne me convient pas"],
  ["AUTRE", "Autre raison"],
] as const;

export function ChurnFeedbackForm() {
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!reason || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/compte/churn-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, ...(comment.trim() ? { comment: comment.trim() } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Impossible d’enregistrer la réponse.");
      setSaved(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  if (saved) return <p className="text-sm text-emerald-300">Merci. Ton retour nous aide à améliorer COAI.</p>;

  return (
    <div className="flex w-full flex-col gap-3 border-t border-white/10 pt-3">
      <p className="text-sm font-medium text-graphite-100">Qu’est-ce qui a motivé ton départ ?</p>
      <div className="flex flex-wrap gap-2">
        {REASONS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setReason(value)}
            className={`rounded-full border px-3 py-2 text-xs transition ${reason === value ? "border-laiton-300 bg-laiton-400/15 text-laiton-200" : "border-white/10 text-graphite-300 hover:border-white/25"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {reason && (
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={500}
          rows={2}
          placeholder="Un détail à nous partager ? (facultatif)"
          className="resize-none rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-sm text-white outline-none placeholder:text-graphite-500 focus:border-laiton-400/40"
        />
      )}
      <Button type="button" size="compact" variant="secondary" disabled={!reason || loading} onClick={submit} className="self-start">
        {loading ? "Enregistrement…" : "Envoyer mon retour"}
      </Button>
      {error && <p className="text-xs text-red-300">{error}</p>}
    </div>
  );
}
