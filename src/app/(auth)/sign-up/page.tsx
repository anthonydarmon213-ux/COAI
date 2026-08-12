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
import { storeIntendedBillingCookie, storeIntendedPlanCookie } from "@/lib/checkout/intended-plan-cookie";
import { clearUtmCookie, readUtmCookie } from "@/lib/attribution/utm-cookie";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";
import Link from "next/link";

export default function SignUpPage() {
  const searchParams = useSearchParams();
  // Un visiteur non connecté qui clique "S'abonner — Transformation" sur
  // /pricing est redirigé ici avec ?plan=STANDARD (cf. SubscribeButton) —
  // sans ça cette page créait toujours un abonnement Impulsion par défaut,
  // quelle que soit l'offre initialement choisie.
  const planVoulu: "GRATUIT" | "STANDARD" = searchParams.get("plan") === "STANDARD" ? "STANDARD" : "GRATUIT";
  const nomFormule = planVoulu === "STANDARD" ? "Transformation" : "Impulsion";
  const prixMensuel = planVoulu === "STANDARD" ? "49€" : "19€";
  const billing: "MONTHLY" | "ANNUAL" = searchParams.get("billing") === "ANNUAL" ? "ANNUAL" : "MONTHLY";
  const prixChoisi = billing === "ANNUAL" ? (planVoulu === "STANDARD" ? "490€" : "190€") : prixMensuel;
  const periode = billing === "ANNUAL" ? "an" : "mois";

  // Le lien de parrainage (?ref=CODE) et l'intention Transformation sont
  // mémorisés en cookie pour survivre à l'aller-retour Google OAuth
  // (l'inscription via Google ne repasse pas par cette page au retour,
  // cf. completer-inscription-form.tsx).
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) storeParrainageCookie(ref);
    if (planVoulu === "STANDARD") storeIntendedPlanCookie("STANDARD");
    if (billing === "ANNUAL") storeIntendedBillingCookie("ANNUAL");
  }, [searchParams, planVoulu, billing]);

  useEffect(() => {
    trackFunnelEvent("signup_started", { plan: planVoulu });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [prenom, setPrenom] = useState("");
  // Pré-rempli si on vient du diagnostic public (/diagnostic), qui capture
  // déjà l'email juste avant de rediriger ici — évite de le ressaisir.
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
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
      setError("La confirmation des conditions de l'offre est requise.");
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

      // Signal mi-funnel (11/08/2026) : compte créé, avant même le paiement
      // — utile à Meta même si la personne abandonne à l'étape Stripe
      // (jusqu'ici aucun événement entre le Lead du quiz et le Subscribe/
      // StartTrial de /bienvenue, tout l'entre-deux était invisible pour
      // l'algorithme de diffusion des pubs).
      trackEvent("compte_cree", { plan: planVoulu });
      trackMetaEvent("CompleteRegistration");
      trackFunnelEvent("signup_completed", { plan: planVoulu });
      trackFunnelEvent("checkout_started", { plan: planVoulu });

      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planVoulu, billing }),
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
            // Carte premium (11/08/2026, correction Anthony) : l'offre
            // Transformation était noyée dans un paragraphe gris discret,
            // au même niveau visuel qu'une mention légale — remplacée par
            // un vrai bloc identifiable, DA noir/or COAI, prix et essai mis
            // en avant plutôt que listés en petit texte. UI uniquement,
            // aucune logique Stripe/trial touchée ici (cf. handleSubmit).
            <div className="flex flex-col gap-3 rounded-2xl border border-laiton-400/40 bg-laiton-400/[0.07] p-4">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-laiton-300">
                Transformation
              </span>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-display text-2xl font-semibold tracking-tight text-laiton-300">
                  7 jours offerts
                </span>
                <span className="text-sm text-graphite-300">puis {prixChoisi}/{periode}</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-sm leading-5 text-graphite-200">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-laiton-400">✓</span>
                  <span>Programme personnalisé généré immédiatement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-laiton-400">✓</span>
                  <span>Entraînement · nutrition · récupération</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-laiton-400">✓</span>
                  <span>Programme relu et validé par un coach diplômé d&apos;État</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-laiton-400">✓</span>
                  <span>Coach IA illimité</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 text-laiton-400">✓</span>
                  <span>1 visio/mois avec Anthony incluse</span>
                </li>
              </ul>
            </div>
          ) : (
            // Impulsion (11/08/2026, correction Anthony) : un seul parcours,
            // plus de choix essai/paiement immédiat — moins engageant pour
            // un trafic froid (pub TikTok/Instagram) de demander un choix
            // supplémentaire. L'essai donne un accès réel et immédiat.
            <div className="flex flex-col gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-graphite-500">
                Formule {nomFormule} — {prixChoisi}/{periode}
              </span>
              <p className="text-xs leading-5 text-graphite-500">
                Ton programme COAI est disponible immédiatement. Profite de COAI gratuitement
                pendant 7 jours, puis {prixChoisi}/{periode}. Résiliable avant la fin de l&apos;essai.
              </p>
            </div>
          )}
          <label className="flex items-start gap-2 text-sm text-graphite-300">
            <input
              type="checkbox"
              checked={consentOffre}
              onChange={(e) => setConsentOffre(e.target.checked)}
              className="mt-1"
            />
            Je reconnais avoir pris connaissance des conditions de l&apos;offre {nomFormule} : 7
            jours d&apos;accès gratuit à compter de ce jour, puis passage automatique à un
            abonnement de {prixChoisi}/{periode}, sauf résiliation avant la fin des 7 jours. Je
            demande le début immédiat du service et reconnais renoncer à mon droit de
            rétractation de 14 jours pour la partie du service déjà utilisée durant la période
            offerte. J&apos;accepte les{" "}
            <Link href="/cgv" target="_blank" className="underline">
              CGV
            </Link>
            .
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading
              ? "Redirection vers le paiement…"
              : planVoulu === "STANDARD"
                ? "Commencer mes 7 jours offerts"
                : "Commencer gratuitement"}
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
