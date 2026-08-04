"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

// Le lien reçu par email (via /mot-de-passe-oublie) ouvre cette page avec une
// session temporaire déjà établie par le client Supabase (détectée dans l'URL).
export default function ReinitialiserMotDePassePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("[reinitialiser-mot-de-passe]", err);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-lab-grid flex min-h-screen items-center justify-center px-6">
      <Card className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>Compte</SectionLabel>
          <h1 className="text-xl font-semibold text-graphite-50">Nouveau mot de passe</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Nouveau mot de passe">
            <Input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Field label="Confirmer le mot de passe">
            <Input
              type="password"
              required
              minLength={8}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </Field>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
