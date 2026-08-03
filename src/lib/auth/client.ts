"use client";

import { createBrowserClient } from "@supabase/ssr";

// Client Supabase Auth pour les Client Components.
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Configuration Supabase manquante (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) — vérifie .env.local et redémarre `npm run dev`."
    );
  }

  return createBrowserClient(url, anonKey);
}
