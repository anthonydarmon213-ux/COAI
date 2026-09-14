"use client";

import { useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

// redirectTo (11/08/2026, amélioration workflow coach) : déjà validé par
// l'appelant (cf. sanitizeReturnTo sur /sign-in) avant d'arriver ici — juste
// répercuté tel quel vers /auth/callback, qui le revalide lui-même avant de
// naviguer dessus (jamais une seule ligne de défense contre l'open redirect).
export function GoogleSignInButton({ redirectTo }: { redirectTo?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  async function handleClick() {
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      if (redirectTo) callbackUrl.searchParams.set("redirect_to", redirectTo);
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callbackUrl.toString() },
      });
      if (signInError) throw signInError;
      // En cas de succès, Google prend le relais : conserver le verrou.
    } catch {
      setError("La connexion avec Google n’a pas pu démarrer. Réessaie ou utilise ton email ci-dessous.");
      busy.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
    <Button type="button" variant="secondary" onClick={handleClick} disabled={loading}>
      {loading ? "Redirection…" : "Continuer avec Google"}
    </Button>
      {error && <p role="alert" className="text-sm leading-6 text-red-400">{error}</p>}
    </div>
  );
}
