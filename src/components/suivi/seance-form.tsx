"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SeanceForm() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [exercice, setExercice] = useState("");
  const [ressenti, setRessenti] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/seances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          exercices: exercice ? [{ nom: exercice }] : [],
          ressenti: ressenti || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : "Échec de l'ajout.");
      setExercice("");
      setRessenti("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-graphite-800 p-4">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-md border border-graphite-700 bg-graphite-900 px-3 py-2 text-graphite-50"
      />
      <input
        type="text"
        placeholder="Exercice principal (ex: squat 5x5)"
        value={exercice}
        onChange={(e) => setExercice(e.target.value)}
        className="rounded-md border border-graphite-700 bg-graphite-900 px-3 py-2 text-graphite-50"
      />
      <input
        type="text"
        placeholder="Ressenti"
        value={ressenti}
        onChange={(e) => setRessenti(e.target.value)}
        className="rounded-md border border-graphite-700 bg-graphite-900 px-3 py-2 text-graphite-50"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Ajout…" : "Ajouter la séance"}
      </Button>
    </form>
  );
}
