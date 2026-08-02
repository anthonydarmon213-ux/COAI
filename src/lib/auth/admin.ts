import { createClient } from "@supabase/supabase-js";

// Client Supabase avec la clé service role : réservé aux opérations serveur
// privilégiées (suppression de compte RGPD, provisioning). Ne jamais exposer
// SUPABASE_SERVICE_ROLE_KEY côté client.
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Configuration Supabase admin manquante");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
