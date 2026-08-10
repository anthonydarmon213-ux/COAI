"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

const NOTES = [1, 2, 3, 4, 5];

export function AvisForm() {
  const [note, setNote] = useState<number | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envoye, setEnvoye] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!note) {
      setError("Choisis une note avant d'envoyer.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/avis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, commentaire }),
      });
      if (!res.ok) throw new Error("Échec de l'envoi.");
      setEnvoye(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  if (envoye) {
    return (
      <Card className="flex flex-col gap-2 text-center">
        <span className="text-2xl">✓</span>
        <p className="text-sm text-graphite-300">
          Merci, ton avis est bien parti — il sert directement à améliorer COAI.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Ta note sur ton expérience COAI">
          <div className="flex gap-2">
            {NOTES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNote(n)}
                aria-pressed={note === n}
                className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition ${
                  note !== null && n <= note
                    ? "border-laiton-400/50 bg-laiton-400/[0.12] text-laiton-300"
                    : "border-graphite-800 bg-graphite-900/60 text-graphite-400 hover:border-graphite-600 hover:text-white"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Qu'est-ce qui marche, qu'est-ce qui pourrait être mieux ?">
          <Textarea
            placeholder="Sois honnête — c'est justement pour améliorer COAI."
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            rows={5}
          />
        </Field>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Envoi…" : "Envoyer mon avis"}
        </Button>
      </form>
    </Card>
  );
}
