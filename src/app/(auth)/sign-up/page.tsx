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
import { storeIntendedPlanCookie, type IntendedPlan } from "@/lib/checkout/intended-plan-cookie";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";
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

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) storeParrainageCookie(ref);
    const requestedPlan = searchParams.get("plan");
    if (requestedPlan === "GRATUIT" || requestedPlan === "STANDARD" || requestedPlan === "PREMIUM") {
      const requestedSessions = Number(searchParams.get("vipSessions"));
      const vipSessions = requestedSessions === 2 || requestedSessions === 3 || requestedSessions === 4
        ? requestedSessions
        : 1;
      storeIntendedPlanCookie(requestedPlan as IntendedPlan, vipSessions);
    }
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
      window.location.href = "/completer-inscription";
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
              <span>Diagnostic enregistré</span>
            </div>
            <h1 className="mt-6 max-w-md font-display text-4xl font-semibold leading-[1.02] tracking-[-0.035em] text-graphite-50 sm:text-5xl">
              Entre dans ton espace COAI.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-graphite-400">
              Retrouve ton profil et le niveau d&apos;accompagnement que tu viens de choisir. Après
              cette étape, tu pourras démarrer ton abonnement en toute sécurité.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {["Ton diagnostic conservé", "Accès immédiat à l'interface", "Aucune carte bancaire"].map((item) => (
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
          <GoogleSignInButton />
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
              {loading ? "Création de ton espace…" : "Créer mon espace personnalisé →"}
            </Button>
          </form>
          <p className="text-sm text-graphite-400">
            Déjà un compte ?{" "}
            <Link href="/sign-in" className="underline">
              Se connecter
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
