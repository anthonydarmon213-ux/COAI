"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

// redirectTo (11/08/2026, amélioration workflow coach) : déjà validé par
// l'appelant (cf. sanitizeReturnTo sur /sign-in) avant d'arriver ici — juste
// répercuté tel quel vers /auth/callback, qui le revalide lui-même avant de
// naviguer dessus (jamais une seule ligne de défense contre l'open redirect).
export function GoogleSignInButton({ redirectTo }: { redirectTo?: string | null }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (redirectTo) callbackUrl.searchParams.set("redirect_to", redirectTo);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString() },
    });
    // La redirection vers Google prend le relais ; pas de reset de loading ici.
  }

  return (
    <Button type="button" variant="secondary" onClick={handleClick} disabled={loading}>
      {loading ? "Redirection…" : "Continuer avec Google"}
    </Button>
  );
}
