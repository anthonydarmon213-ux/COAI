"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export function PrenomForm({
  prenom,
  nom,
  email,
  dateNaissance,
}: {
  prenom: string | null;
  nom: string | null;
  email: string;
  dateNaissance: string | null;
}) {
  const router = useRouter();
  const [prenomValue, setPrenomValue] = useState(prenom ?? "");
  const [nomValue, setNomValue] = useState(nom ?? "");
  const [dateNaissanceValue, setDateNaissanceValue] = useState(dateNaissance ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/compte/prenom", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prenom: prenomValue.trim() || null,
          nom: nomValue.trim() || null,
          dateNaissance: dateNaissanceValue || null,
        }),
      });
      if (!res.ok) throw new Error("Échec de l'enregistrement.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label="Prénom">
        <Input type="text" value={prenomValue} onChange={(e) => setPrenomValue(e.target.value)} />
      </Field>
      <Field label="Nom">
        <Input type="text" value={nomValue} onChange={(e) => setNomValue(e.target.value)} />
      </Field>
      <Field label="Date de naissance">
        <Input
          type="date"
          value={dateNaissanceValue}
          onChange={(e) => setDateNaissanceValue(e.target.value)}
        />
      </Field>
      <Field label="Email">
        <Input type="email" value={email} disabled />
      </Field>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && !error && <p className="text-sm text-laiton-400">Identité enregistrée.</p>}
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
