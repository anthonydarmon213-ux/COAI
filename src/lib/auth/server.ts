import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/client";

// Client Supabase Auth pour les Server Components / Route Handlers.
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Appelé depuis un Server Component (pas une Server Action /
            // Route Handler) — le rafraîchissement du token est déjà pris
            // en charge par le middleware, cet appel peut être ignoré.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // idem
          }
        },
      },
    }
  );
}

export async function getCurrentUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Résout l'utilisateur applicatif (table `users`, via supabaseAuthId) à partir
// de la session Supabase Auth courante. Retourne null si non authentifié ou si
// l'enregistrement User n'a pas encore été créé (cf. /api/compte/register).
export async function getCurrentAppUser() {
  const authUser = await getCurrentUser();
  if (!authUser) return null;

  return prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { profile: true, subscription: true },
  });
}
