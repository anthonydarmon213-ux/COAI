"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("[sign-in]", err);
      setError(err instanceof Error ? err.message : "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="bg-lab-grid flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-widest text-graphite-400 transition hover:text-white"
      >
        ← Retour à l&apos;accueil
      </Link>
      <Card className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>Connexion</SectionLabel>
          <h1 className="text-xl font-semibold text-graphite-50">Se connecter</h1>
        </div>
        <GoogleSignInButton />
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-graphite-500">
          <div className="h-px flex-1 bg-graphite-800" />
          ou
          <div className="h-px flex-1 bg-graphite-800" />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Email">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Mot de passe">
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
        <Link href="/mot-de-passe-oublie" className="text-sm text-graphite-400 underline">
          Mot de passe oublié ?
        </Link>
        <p className="text-sm text-graphite-400">
          Pas encore de compte ?{" "}
          <Link href="/sign-up" className="underline">
            S&apos;inscrire
          </Link>
        </p>
      </Card>
    </main>
  );
}
