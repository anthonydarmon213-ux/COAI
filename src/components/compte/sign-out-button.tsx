"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth/client";

type SignOutButtonProps = {
  variant?: "link" | "icon";
};

export function SignOutButton({ variant = "link" }: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleSignOut}
        disabled={loading}
        aria-label="Se déconnecter"
        title="Se déconnecter"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-graphite-400 transition hover:border-white/20 hover:text-white disabled:opacity-50"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="text-sm text-graphite-400 underline hover:text-graphite-200"
    >
      {loading ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
