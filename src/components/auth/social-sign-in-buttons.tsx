"use client";

import { useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

// redirectTo (11/08/2026, amélioration workflow coach) : déjà validé par
// l'appelant (cf. sanitizeReturnTo sur /sign-in) avant d'arriver ici — juste
// répercuté tel quel vers /auth/callback, qui le revalide lui-même avant de
// naviguer dessus (jamais une seule ligne de défense contre l'open redirect).
export function SocialSignInButtons({ redirectTo }: { redirectTo?: string | null }) {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  // Public display switch only. Provider credentials stay in Supabase/Apple.
  const appleEnabled = process.env.NEXT_PUBLIC_APPLE_SIGN_IN_ENABLED === "true";

  async function handleClick(provider: "google" | "apple") {
    if (busy.current || (provider === "apple" && !appleEnabled)) return;
    busy.current = true;
    setError(null);
    setLoading(provider);
    try {
      const supabase = createSupabaseBrowserClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      if (redirectTo) callbackUrl.searchParams.set("redirect_to", redirectTo);
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl.toString() },
      });
      if (signInError) throw signInError;
      // En cas de succès, le fournisseur prend le relais : conserver le verrou.
    } catch {
      setError(`La connexion avec ${provider === "apple" ? "Apple" : "Google"} n’a pas pu démarrer. Réessaie ou utilise ton email ci-dessous.`);
      busy.current = false;
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
    {appleEnabled && <Button type="button" variant="secondary" onClick={() => handleClick("apple")} disabled={loading !== null} className="min-h-11">
      {loading === "apple" ? "Redirection…" : "Continuer avec Apple"}
    </Button>}
    <Button type="button" variant="secondary" onClick={() => handleClick("google")} disabled={loading !== null} className="min-h-11">
      {loading === "google" ? "Redirection…" : "Continuer avec Google"}
    </Button>
      {error && <p role="alert" className="text-sm leading-6 text-red-400">{error}</p>}
    </div>
  );
}
