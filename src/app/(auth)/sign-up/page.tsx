"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consentRgpd, setConsentRgpd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!consentRgpd) {
      setError("Le consentement au traitement des données de santé est requis.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      const res = await fetch("/api/compte/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentRgpd }),
      });
      if (!res.ok) throw new Error("Impossible de finaliser la création du compte.");

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6">
      <h1 className="text-xl font-semibold text-laiton-400">Créer un compte</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-graphite-700 bg-graphite-900 px-3 py-2 text-graphite-50"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-graphite-700 bg-graphite-900 px-3 py-2 text-graphite-50"
        />
        <label className="flex items-start gap-2 text-sm text-graphite-200">
          <input
            type="checkbox"
            checked={consentRgpd}
            onChange={(e) => setConsentRgpd(e.target.checked)}
            className="mt-1"
          />
          Je consens au traitement de mes données de santé pour la personnalisation de mon
          coaching (RGPD).
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Création…" : "Créer mon compte"}
        </Button>
      </form>
    </main>
  );
}
