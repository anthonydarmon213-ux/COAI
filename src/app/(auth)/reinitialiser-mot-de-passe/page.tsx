"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseRecoveryClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

// Le lien reçu par email (via /mot-de-passe-oublie) ouvre cette page avec une
// session temporaire déjà établie par le client Supabase (détectée dans l'URL).
export default function ReinitialiserMotDePassePage() {
  const router = useRouter();
  const [supabase] = useState(() => createSupabaseRecoveryClient());
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) {
        setSessionReady(true);
        setCheckingSession(false);
        setError(null);
      }
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      setCheckingSession(false);

      if (sessionError || !data.session) {
        setError("Ce lien est invalide ou a expiré. Demande un nouveau lien de réinitialisation.");
        return;
      }

      setSessionReady(true);
      setError(null);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      await supabase.auth.signOut();
      router.push("/sign-in?password_reset=success");
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
    <main className="coai-access-page flex min-h-screen items-center justify-center px-6">
      <Card className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>Compte</SectionLabel>
          <h1 className="text-xl font-semibold text-graphite-50">Nouveau mot de passe</h1>
        </div>
        {checkingSession ? (
          <p className="text-sm text-graphite-200">Vérification du lien sécurisé…</p>
        ) : sessionReady ? (
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
        ) : (
          <div className="flex flex-col gap-3">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <a href="/mot-de-passe-oublie" className="text-sm text-laiton-400 underline">
              Demander un nouveau lien
            </a>
          </div>
        )}
      </Card>
    </main>
  );
}
