"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth/client";

type SignOutButtonProps = {
  variant?: "link" | "icon";
};

export function SignOutButton({ variant = "link" }: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const pending = useRef(false);

  async function handleSignOut() {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError(false);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      router.replace("/sign-in");
      router.refresh();
    } catch {
      pending.current = false;
      setLoading(false);
      setError(true);
    }
  }

  const feedback = error && <span role="alert" className="text-xs text-red-300">Déconnexion non confirmée. Vérifie ta connexion et réessaie.</span>;
  if (variant === "icon") {
    return (
      <>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={loading}
        aria-label={loading ? "Déconnexion…" : "Se déconnecter"}
        aria-busy={loading}
        title="Se déconnecter"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-graphite-400 transition hover:border-white/20 hover:text-white disabled:opacity-50"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
      {feedback}
      </>
    );
  }

  return (
    <>
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      aria-busy={loading}
      className="min-h-11 px-2 text-sm text-graphite-400 underline hover:text-graphite-200 disabled:opacity-50"
    >
      {loading ? "Déconnexion…" : "Se déconnecter"}
    </button>
    {feedback}
    </>
  );
}
