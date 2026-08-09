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
import { storeIntendedPlanCookie } from "@/lib/checkout/intended-plan-cookie";
import Link from "next/link";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  // Un visiteur non connecté qui clique "S'abonner — Transformation" sur
  // /pricing est redirigé ici avec ?plan=STANDARD (cf. SubscribeButton) —
  // sans ça cette page créait toujours un abonnement Impulsion par défaut,
  // quelle que soit l'offre initialement choisie.
  const planVoulu: "GRATUIT" | "STANDARD" = searchParams.get("plan") === "STANDARD" ? "STANDARD" : "GRATUIT";

  // Le lien de parrainage (?ref=CODE) et l'intention Transformation sont
  // mémorisés en cookie pour survivre à l'aller-retour Google OAuth
  // (l'inscription via Google ne repasse pas par cette page au retour,
  // cf. completer-inscription-form.tsx).
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) storeParrainageCookie(ref);
    if (planVoulu === "STANDARD") storeIntendedPlanCookie("STANDARD");
  }, [searchParams, planVoulu]);

  const [prenom, setPrenom] = useState("");
  // Pré-rempli si on vient du diagnostic public (/diagnostic), qui capture
  // déjà l'email juste avant de rediriger ici — évite de le ressaisir.
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [consentRgpd, setConsentRgpd] = useState(false);
  const [consentSante, setConsentSante] = useState(false);
  const [consentOffre, setConsentOffre] = useState(false);
  const [skipTrial, setSkipTrial] = useState(false);
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
      setError("La confirmation des conditions de l'offre est requise.");
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
        body: JSON.stringify(
          planVoulu === "STANDARD" ? { plan: "STANDARD" } : { plan: "GRATUIT", skipTrial }
        ),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok || !checkoutData.url) {
        throw new Error(checkoutData.error ?? "Impossible de démarrer l'abonnement.");
      }
      window.location.href = checkoutData.url;
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
          {planVoulu === "STANDARD" ? (
            <p className="rounded-lg border border-laiton-400/40 bg-laiton-400/10 px-3 py-2 text-xs text-laiton-200">
              Formule <span className="font-semibold">Transformation — 49€/mois</span>, programme
              relu et validé par un coach diplômé d&apos;État.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-graphite-500">
                Formule Impulsion — 19€/mois
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSkipTrial(false)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition ${
                    !skipTrial
                      ? "border-laiton-400/40 bg-laiton-400/10 text-laiton-200"
                      : "border-graphite-800 text-graphite-400 hover:text-white"
                  }`}
                >
                  <span className="block font-semibold">7 jours offerts</span>
                  <span className="block text-graphite-500">puis 19€/mois</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSkipTrial(true)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition ${
                    skipTrial
                      ? "border-laiton-400/40 bg-laiton-400/10 text-laiton-200"
                      : "border-graphite-800 text-graphite-400 hover:text-white"
                  }`}
                >
                  <span className="block font-semibold">Démarrer tout de suite</span>
                  <span className="block text-graphite-500">19€/mois dès aujourd&apos;hui</span>
                </button>
              </div>
            </div>
          )}
          <label className="flex items-start gap-2 text-sm text-graphite-300">
            <input
              type="checkbox"
              checked={consentOffre}
              onChange={(e) => setConsentOffre(e.target.checked)}
              className="mt-1"
            />
            {planVoulu === "STANDARD" ? (
              <>
                Je reconnais avoir pris connaissance des conditions de l&apos;offre
                Transformation : 49€/mois, facturé immédiatement dès l&apos;inscription, sans
                engagement. Je demande le début immédiat du service et reconnais renoncer à mon
                droit de rétractation de 14 jours pour la partie du service déjà utilisée.
                J&apos;accepte les{" "}
                <Link href="/cgv" target="_blank" className="underline">
                  CGV
                </Link>
                .
              </>
            ) : skipTrial ? (
              <>
                Je reconnais avoir pris connaissance des conditions de l&apos;offre : abonnement
                Impulsion à 19€/mois, facturé immédiatement dès l&apos;inscription (sans période
                d&apos;essai). Je demande le début immédiat du service et reconnais renoncer à mon
                droit de rétractation de 14 jours pour la partie du service déjà utilisée.
                J&apos;accepte les{" "}
                <Link href="/cgv" target="_blank" className="underline">
                  CGV
                </Link>
                .
              </>
            ) : (
              <>
                Je reconnais avoir pris connaissance des conditions de l&apos;offre : 7 jours
                d&apos;accès gratuit à compter de ce jour, puis passage automatique à un
                abonnement de 19€/mois, sauf résiliation avant la fin des 7 jours. Je demande le
                début immédiat du service et reconnais renoncer à mon droit de rétractation de 14
                jours pour la partie du service déjà utilisée durant la période offerte.
                J&apos;accepte les{" "}
                <Link href="/cgv" target="_blank" className="underline">
                  CGV
                </Link>
                .
              </>
            )}
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading
              ? "Redirection vers le paiement…"
              : planVoulu === "STANDARD"
                ? "Créer mon compte — 49€/mois"
                : skipTrial
                  ? "Démarrer maintenant — 19€/mois"
                  : "Créer mon compte — 7 jours offerts"}
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
