"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // La redirection vers Google prend le relais ; pas de reset de loading ici.
  }

  return (
    <Button type="button" variant="secondary" onClick={handleClick} disabled={loading}>
      {loading ? "Redirection…" : "Continuer avec Google"}
    </Button>
  );
}
