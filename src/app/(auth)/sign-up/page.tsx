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
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";
import Link from "next/link";

// Nouveau modèle d'accès libre (13/08/2026) : l'inscription est gratuite et
// ne déclenche plus aucun paiement — Impulsion (19€, one-shot) et
// Transformation (49€/mois) se débloquent séparément, une fois dans
// l'interface (cf. OffreConsentGate).
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
      <main className="bg-lab-grid flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <Card className="flex w-full max-w-sm flex-col gap-3 text-center">
          <SectionLabel>Vérifie ta boîte mail</SectionLabel>
          <h1 className="text-xl font-semibold text-graphite-50">Un lien t&apos;attend dans tes emails</h1>
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
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "Envoi du lien de confirmation…" : "Continuer"}
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
