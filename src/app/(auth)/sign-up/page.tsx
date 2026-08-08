"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { clearParrainageCookie, readParrainageCookie, storeParrainageCookie } from "@/lib/parrainage/cookie";
import Link from "next/link";

export default function SignUpPage() {
  const searchParams = useSearchParams();

  // Le lien de parrainage (?ref=CODE) est mémorisé en cookie pour survivre
  // à l'aller-retour Google OAuth (l'inscription via Google ne repasse pas
  // par cette page au retour, cf. completer-inscription-form.tsx).
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) storeParrainageCookie(ref);
  }, [searchParams]);

  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consentRgpd, setConsentRgpd] = useState(false);
  const [consentSante, setConsentSante] = useState(false);
  const [consentOffre, setConsentOffre] = useState(false);
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
    if (!consentOffre) {
      setError("La confirmation des conditions de l'offre d'essai est requise.");
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
        body: JSON.stringify({
          consentRgpd,
          consentSante,
          prenom: prenom || undefined,
          parrainageCode: readParrainageCookie() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Impossible de finaliser la création du compte.");
      clearParrainageCookie();

      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "GRATUIT" }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok || !checkoutData.url) {
        throw new Error(checkoutData.error ?? "Impossible de démarrer l'offre d'essai.");
      }
      window.location.href = checkoutData.url;
    } catch (err) {
      console.error("[sign-up]", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <main className="bg-lab-grid flex min-h-screen items-center justify-center px-6">
      <Card className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionLabel>Inscription</SectionLabel>
          <h1 className="text-xl font-semibold text-graphite-50">Créer un compte</h1>
        </div>
        <GoogleSignInButton />
        <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-graphite-500">
          <div className="h-px flex-1 bg-graphite-800" />
          ou
          <div className="h-px flex-1 bg-graphite-800" />
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Prénom">
            <Input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
          </Field>
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
            Je certifie être apte à la pratique sportive, ou avoir consulté un médecin en cas de
            doute ou d&apos;antécédent médical.
          </label>
          <label className="flex items-start gap-2 text-sm text-graphite-300">
            <input
              type="checkbox"
              checked={consentOffre}
              onChange={(e) => setConsentOffre(e.target.checked)}
              className="mt-1"
            />
            Je reconnais avoir pris connaissance des conditions de l&apos;offre : 7 jours d&apos;accès
            gratuit à compter de ce jour, puis passage automatique à un abonnement de 19€/mois,
            sauf résiliation avant la fin des 7 jours. Je demande le début immédiat du
            service et reconnais renoncer à mon droit de rétractation de 14 jours pour la partie
            du service déjà utilisée durant la période offerte. J&apos;accepte les{" "}
            <Link href="/cgv" target="_blank" className="underline">
              CGV
            </Link>
            .
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Redirection vers le paiement…" : "Créer mon compte — 7 jours offerts"}
          </Button>
        </form>
        <p className="text-sm text-graphite-400">
          Déjà un compte ?{" "}
          <Link href="/sign-in" className="underline">
            Se connecter
          </Link>
        </p>
      </Card>
    </main>
  );
}
