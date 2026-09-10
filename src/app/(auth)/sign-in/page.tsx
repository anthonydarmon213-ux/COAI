"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { sanitizeReturnTo, signupHrefForReturnTo } from "@/lib/auth/safe-redirect";
import { ConfirmationEmail } from "@/components/auth/confirmation-email";
import { authLinkIssue, type AuthLinkIssue } from "@/lib/auth/confirmation";
import {
  readIntendedBillingCookie,
  readIntendedPlanCookie,
} from "@/lib/checkout/intended-plan-cookie";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Posé par middleware.ts quand une route protégée (dont /admin/*) a
  // redirigé ici faute d'authentification — permet de renvoyer le coach
  // exactement là où il voulait aller (ex: le lien "Valider le programme"
  // reçu par email) une fois connecté, plutôt que toujours /dashboard.
  // Validé à la fois ici (avant navigation) et par la page de destination
  // elle-même (auth + rôle admin vérifiés côté serveur), jamais une seule
  // ligne de défense.
  const returnTo = sanitizeReturnTo(searchParams.get("redirect_to"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [linkIssue, setLinkIssue] = useState<AuthLinkIssue | null>(null);
  useEffect(() => {
    const update = () => setLinkIssue(authLinkIssue(window.location.search, window.location.hash));
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, [searchParams]);

  function destinationApresConnexion() {
    if (returnTo) return returnTo;
    const intendedPlan = readIntendedPlanCookie();
    if (!intendedPlan) return "/dashboard";
    const billing = readIntendedBillingCookie();
    return `/pricing?from=signin&selected=${intendedPlan}&billing=${billing}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        if (signInError.code === "email_not_confirmed") {
          setLinkIssue("confirmation");
          setError("Confirme ton adresse email avant de te connecter.");
          return;
        }
        throw signInError;
      }

      router.push(destinationApresConnexion());
      router.refresh();
    } catch (err) {
      setError("Connexion impossible. Vérifie ton email et ton mot de passe, puis réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="coai-access-page flex min-h-screen flex-col items-center justify-center gap-6 px-6">
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
        {linkIssue && <p role="alert" className="text-sm leading-6 text-amber-200">
          {linkIssue === "oauth" ? "La connexion n’a pas abouti. Réessaie avec Google ou ton email." : "Ce lien a expiré, a déjà été utilisé ou ne peut pas être ouvert ici. Si ton compte est confirmé, connecte-toi. Sinon, demande un nouveau lien ci-dessous."}
        </p>}
        <GoogleSignInButton redirectTo={returnTo} />
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-graphite-500">
          <div className="h-px flex-1 bg-graphite-800" />
          ou
          <div className="h-px flex-1 bg-graphite-800" />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Email">
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Mot de passe">
            <Input
              type="password"
              autoComplete="current-password"
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
        {linkIssue && linkIssue !== "oauth" && <ConfirmationEmail initialEmail={email} returnTo={returnTo} />}
        <Link href="/mot-de-passe-oublie" className="text-sm text-graphite-400 underline">
          Mot de passe oublié ?
        </Link>
        <p className="text-sm text-graphite-400">
          Pas encore de compte ?{" "}
          <Link href={signupHrefForReturnTo(returnTo)} className="underline">
            S&apos;inscrire
          </Link>
        </p>
      </Card>
    </main>
  );
}
