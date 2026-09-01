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
import { storeParrainageCookie } from "@/lib/parrainage/cookie";
import {
  storeIntendedPlanCookie,
  type IntendedBilling,
  type IntendedPlan,
} from "@/lib/checkout/intended-plan-cookie";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";
import { sanitizeReturnTo } from "@/lib/auth/safe-redirect";
import Link from "next/link";

// L'inscription reste gratuite et ne déclenche aucun paiement. Le choix
// Pass IA, Coaching Hybride ou VIP est conservé jusqu'au checkout Stripe,
// déclenché seulement après le consentement explicite aux conditions.
//
// Vérification d'adresse email (14/08/2026, retour d'une testeuse — Elsa,
// via Anthony : "on peut entrer des fausses adresses pour créer des
// comptes") : jusqu'ici cette page créait la ligne User applicative tout de
// suite après supabase.auth.signUp(), sans jamais s'assurer que l'email
// saisi appartient réellement à la personne. Corrigé en s'appuyant sur la
// vérification native de Supabase (email de confirmation avec lien) plutôt
// que de la réinventer : le compte applicatif n'est désormais créé
// qu'après que le lien reçu par email a été cliqué, sur /completer-inscription
// (même écran de consentement RGPD/aptitude sportive que le flow Google
// OAuth, qui a toujours fonctionné ainsi — juste jamais réutilisé ici avant
// aujourd'hui). RGPD/santé ne sont donc plus demandés sur cet écran : les
// redemander au moment réel de la création du compte est plus correct, pas
// juste plus simple.
//
// Important côté Supabase : ceci ne bloque réellement une fausse adresse
// que si "Confirm email" est activé dans Authentication → Providers → Email
// sur le dashboard Supabase — un réglage de projet, pas quelque chose que ce
// code peut forcer depuis l'application. Si ce réglage est déjà actif,
// aucun changement de configuration n'est nécessaire. Sinon, Supabase
// renvoie une session immédiatement après signUp() : le code gère les deux
// cas (session déjà là → direction /completer-inscription tout de suite ;
// pas de session → écran "vérifie ta boîte mail").
export default function SignUpPage() {
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const requestedPlan: IntendedPlan | null =
    planParam === "GRATUIT" || planParam === "STANDARD" || planParam === "PREMIUM"
      ? planParam
      : null;
  const requestedBilling: IntendedBilling = searchParams.get("billing") === "ANNUAL" ? "ANNUAL" : "MONTHLY";
  const arriveDepuisInstagram = searchParams.get("source") === "instagram";
  const requestedReturn = sanitizeReturnTo(searchParams.get("redirect_to"));
  const destinationApresInscription = requestedPlan
    ? `/pricing?from=signin&selected=${requestedPlan}&billing=${requestedBilling}`
    : requestedReturn ?? "/pricing?from=signin";

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) storeParrainageCookie(ref);
    if (requestedPlan) {
      const requestedSessions = Number(searchParams.get("vipSessions"));
      const vipSessions = requestedSessions === 2 || requestedSessions === 3 || requestedSessions === 4
        ? requestedSessions
        : 1;
      storeIntendedPlanCookie(requestedPlan, vipSessions, requestedBilling);
    }
  }, [requestedBilling, requestedPlan, searchParams]);

  useEffect(() => {
    trackFunnelEvent("signup_started", {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [prenom, setPrenom] = useState(() => searchParams.get("prenom") ?? "");
  // Pré-rempli si on vient du diagnostic public (/diagnostic), qui capture
  // déjà l'email juste avant de rediriger ici — évite de le ressaisir.
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailEnvoye, setEmailEnvoye] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: prenom ? { given_name: prenom } : undefined,
          emailRedirectTo: (() => {
            const callbackUrl = new URL("/auth/callback", window.location.origin);
            callbackUrl.searchParams.set("redirect_to", destinationApresInscription);
            return callbackUrl.toString();
          })(),
        },
      });
      if (signUpError) throw signUpError;

      if (!data.session) {
        // Confirmation par email requise avant de pouvoir créer le compte
        // applicatif — cf. note en tête de fichier.
        setEmailEnvoye(true);
        setLoading(false);
        return;
      }

      // Confirmation déjà effective (email confirmation désactivée côté
      // Supabase) : le compte applicatif se crée sur /completer-inscription,
      // qui recueille RGPD/aptitude sportive puis appelle /api/compte/register.
      window.location.href = `/completer-inscription?redirect_to=${encodeURIComponent(destinationApresInscription)}`;
    } catch (err) {
      console.error("[sign-up]", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  if (emailEnvoye) {
    return (
      <main className="coai-access-page flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <Card className="coai-access-card flex w-full max-w-md flex-col gap-4 text-center">
          <SectionLabel>Vérifie ta boîte mail</SectionLabel>
          <h1 className="font-display text-3xl font-semibold text-graphite-50">Ton espace est presque prêt.</h1>
          <p className="text-sm text-graphite-400">
            On a envoyé un lien de confirmation à <span className="text-graphite-200">{email}</span>.
            Clique dessus pour activer ton compte — pense à vérifier tes spams si tu ne le vois pas
            passer.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="coai-access-page flex min-h-screen flex-col items-center justify-center gap-6 px-5 py-10 sm:px-8">
      <Link
        href="/"
        className="coai-access-back text-xs font-semibold text-graphite-400 transition hover:text-white"
      >
        ← Retour à l&apos;accueil
      </Link>
      <div className="coai-access-shell grid w-full max-w-4xl overflow-hidden rounded-[2rem] lg:grid-cols-[1.05fr_.95fr]">
        <section className="coai-access-intro flex flex-col justify-between gap-10 px-7 py-8 sm:px-10 sm:py-10">
          <div>
            <div className="coai-diagnostic-kicker">
              <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
              <span>
                {arriveDepuisInstagram ? "Étape 1 sur 2 · compte puis Stripe" : "Après ton bilan · création du compte"}
              </span>
            </div>
            <h1 className="mt-6 max-w-md font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-graphite-50 sm:text-5xl">
              {arriveDepuisInstagram ? "Crée ton accès avant Stripe." : "Entre dans ton espace COAI."}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-graphite-400">
              {arriveDepuisInstagram
                ? "Instagram utilise une connexion séparée de Safari. Ton offre est conservée : crée ton accès ou connecte-toi, puis tu reviendras la confirmer avant Stripe."
                : "Ton résultat personnalisé est conservé. Si tu viens du bilan express, tu accèdes d'abord au programme Mobilité totale offert."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {(arriveDepuisInstagram
              ? ["Ton offre conservée", "Connexion sécurisée", "Aucun débit aujourd'hui"]
              : ["Ton résultat conservé", "Mobilité offerte", "Aucun paiement automatique"]
            ).map((item) => (
              <div key={item} className="coai-access-proof"><span aria-hidden="true">✓</span>{item}</div>
            ))}
          </div>
        </section>

        <Card className="coai-access-card flex w-full flex-col gap-5 rounded-none border-0">
          <div className="flex flex-col gap-1">
            <SectionLabel>Accès personnel</SectionLabel>
            <h2 className="font-display text-2xl font-semibold text-graphite-50">Créer mon compte gratuit</h2>
            <p className="text-sm leading-6 text-graphite-400">Une minute suffit pour retrouver ton analyse.</p>
          </div>
          <GoogleSignInButton redirectTo={destinationApresInscription} />
          <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-graphite-500">
            <div className="h-px flex-1 bg-graphite-800" />
            ou
            <div className="h-px flex-1 bg-graphite-800" />
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Prénom">
              <Input className="coai-access-input" type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
            </Field>
            <Field label="Email">
              <Input
                className="coai-access-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Mot de passe">
              <Input
                className="coai-access-input"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Création de ton espace…" : "Créer mon compte gratuit →"}
            </Button>
          </form>
          <p className="text-sm text-graphite-400">
            Déjà un compte ?{" "}
            <Link href={`/sign-in?redirect_to=${encodeURIComponent(destinationApresInscription)}`} className="underline">
              Se connecter
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
