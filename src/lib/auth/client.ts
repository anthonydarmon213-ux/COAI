"use client";

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Configuration Supabase manquante (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) — vérifie .env.local et redémarre `npm run dev`."
    );
  }

  return { url, anonKey };
}

// Client Supabase Auth pour les Client Components.
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getPublicSupabaseConfig();

  return createBrowserClient(url, anonKey);
}

// Le lien de récupération peut être ouvert dans un autre navigateur que celui
// qui l'a demandé (par exemple Safari depuis l'app Mail). Le flux implicite
// transporte la session temporaire dans le fragment du lien et évite donc la
// dépendance au code verifier local du flux PKCE utilisé par l'app SSR.
export function createSupabaseRecoveryClient() {
  const { url, anonKey } = getPublicSupabaseConfig();

  return createClient(url, anonKey, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
