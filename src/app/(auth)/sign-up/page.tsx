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
import { clearUtmCookie, readUtmCookie } from "@/lib/attribution/utm-cookie";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";
import Link from "next/link";

// Nouveau modèle d'accès libre (13/08/2026) : l'inscription est gratuite et
// ne déclenche plus aucun paiement — Impulsion (19€, one-shot) et
// Transformation (49€/mois) se débloquent séparément, une fois dans
// l'interface (cf. OffreConsentGate). Cette page n'a donc plus besoin de
// connaître un plan visé ni de faire signer les conditions d'une offre
// précise ; RGPD et aptitude sportive restent recueillis ici car ils
// concernent l'usage de l'app en général, pas un paiement particulier.
export default function SignUpPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) storeParrainageCookie(ref);
  }, [searchParams]);

  useEffect(() => {
    trackFunnelEvent("signup_started", {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [prenom, setPrenom] = useState("");
  // Pré-rempli si on vient du diagnostic public (/diagnostic), qui capture
  // déjà l'email juste avant de rediriger ici — évite de le ressaisir.
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
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
      const supabase = createSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) throw signUpError;

      const utm = readUtmCookie();
      const res = await fetch("/api/compte/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentRgpd,
          consentSante,
          prenom: prenom || undefined,
          parrainageCode: readParrainageCookie() || undefined,
          ...utm,
        }),
      });
      if (!res.ok) throw new Error("Impossible de finaliser la création du compte.");
      clearParrainageCookie();
      clearUtmCookie();

      trackEvent("compte_cree", {});
      trackMetaEvent("CompleteRegistration");
      trackFunnelEvent("signup_completed", {});

      window.location.href = "/bienvenue";
    } catch (err) {
      console.error("[sign-up]", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
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
          <SectionLabel>Inscription</SectionLabel>
          <h1 className="text-xl font-semibold text-graphite-50">Créer un compte gratuit</h1>
          <p className="text-sm text-graphite-400">
            Découvre l&apos;interface COAI et toutes ses fonctionnalités. Aucune carte bancaire
            requise — tu choisis ce que tu débloques, quand tu veux.
          </p>
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
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Création du compte…" : "Créer mon compte gratuit"}
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
