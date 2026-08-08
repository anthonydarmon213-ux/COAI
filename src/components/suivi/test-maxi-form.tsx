"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

const EXERCICES = [
  { value: "DEVELOPPE_COUCHE", label: "Développé couché", unite: "kg", qualite: "Force" },
  { value: "SQUAT", label: "Squat", unite: "kg", qualite: "Force" },
  { value: "SOULEVE_DE_TERRE", label: "Soulevé de terre", unite: "kg", qualite: "Force" },
  { value: "TRACTION", label: "Traction", unite: "reps", qualite: "Force" },
  { value: "SOUPLESSE", label: "Flexion antérieure", unite: "cm", qualite: "Souplesse" },
  { value: "EQUILIBRE", label: "Appui unipodal (yeux fermés)", unite: "secondes", qualite: "Équilibre" },
  { value: "ENDURANCE", label: "Test de Cooper (12 min)", unite: "m", qualite: "Endurance" },
] as const;

export function TestMaxiForm() {
  const router = useRouter();
  const [exercice, setExercice] = useState<(typeof EXERCICES)[number]["value"]>("DEVELOPPE_COUCHE");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [valeur, setValeur] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uniteActuelle = EXERCICES.find((e) => e.value === exercice)!.unite;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tests-maxi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercice,
          date,
          valeur: valeur ? Number(valeur) : undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : "Échec de l'ajout.");
      setValeur("");
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Test">
          <Select value={exercice} onChange={(e) => setExercice(e.target.value as typeof exercice)}>
            {EXERCICES.map((ex) => (
              <option key={ex.value} value={ex.value}>
                {ex.qualite} — {ex.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label={`Résultat (${uniteActuelle})`}>
          <Input
            type="number"
            step="0.5"
            required
            value={valeur}
            onChange={(e) => setValeur(e.target.value)}
          />
        </Field>
        <Field label="Notes (optionnel)">
          <Input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Ajout…" : "Ajouter le test"}
        </Button>
      </form>
    </Card>
  );
}
