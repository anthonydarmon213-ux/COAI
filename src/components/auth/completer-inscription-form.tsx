"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import Link from "next/link";

export function CompleterInscriptionForm({ prenomSuggere }: { prenomSuggere: string }) {
  const router = useRouter();
  const [prenom, setPrenom] = useState(prenomSuggere);
  const [consentRgpd, setConsentRgpd] = useState(false);
  const [consentSante, setConsentSante] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!consentRgpd) {
      setError("Le consentement au traitement des données de santé est requis.");
      return;
    }
    if (!consentSante) {
      setError("La certification d'aptitude sportive est requise.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/compte/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentRgpd, consentSante, prenom: prenom || undefined }),
      });
      if (!res.ok) throw new Error("Impossible de finaliser la création du compte.");

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("[completer-inscription]", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Prénom">
        <Input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
      </Field>
      <label className="flex items-start gap-2 text-sm text-graphite-300">
        <input
          type="checkbox"
          checked={consentRgpd}
          onChange={(e) => setConsentRgpd(e.target.checked)}
          className="mt-1"
        />
        J&apos;ai lu la{" "}
        <Link href="/confidentialite" target="_blank" className="underline">
          politique de confidentialité
        </Link>{" "}
        et je consens au traitement de mes données de santé pour la personnalisation de mon
        coaching (RGPD).
      </label>
      <label className="flex items-start gap-2 text-sm text-graphite-300">
        <input
          type="checkbox"
          checked={consentSante}
          onChange={(e) => setConsentSante(e.target.checked)}
          className="mt-1"
        />
        Je certifie être apte à la pratique sportive, ou avoir consulté un médecin en cas de doute
        ou d&apos;antécédent médical.
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Finalisation…" : "Accéder à mon espace"}
      </Button>
    </form>
  );
}
