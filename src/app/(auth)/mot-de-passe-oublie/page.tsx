"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { recoveryHref, recoveryError } from "@/lib/auth/recovery-navigation";
import { createSupabaseRecoveryClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

export default function MotDePasseOubliePage() {
  return <Suspense fallback={<p>Chargement…</p>}><RecoveryForm /></Suspense>;
}

function RecoveryForm() {
  const returnTo = useSearchParams().get("redirect_to");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseRecoveryClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + recoveryHref("/reinitialiser-mot-de-passe", returnTo),
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(recoveryError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="coai-access-page flex min-h-screen items-center justify-center px-6">
      <Card className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>Compte</SectionLabel>
          <h1 className="text-xl font-semibold text-graphite-50">Mot de passe oublié</h1>
        </div>

        {sent ? (
          <p role="status" className="text-sm text-graphite-200">
            Si un compte existe avec cette adresse, un email vient d&apos;être envoyé avec un
            lien pour choisir un nouveau mot de passe.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Email">
              <Input
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi…" : "Envoyer le lien de réinitialisation"}
            </Button>
          </form>
        )}
        <Link href={recoveryHref("/sign-in", returnTo)} className="flex min-h-11 items-center text-sm text-graphite-300 underline">Retour à la connexion</Link>
      </Card>
    </main>
  );
}
