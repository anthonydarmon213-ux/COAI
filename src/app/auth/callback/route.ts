import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { sanitizeReturnTo } from "@/lib/auth/safe-redirect";

// Point d'atterrissage du flow OAuth (ex: Google) initié par
// supabase.auth.signInWithOAuth. Échange le code contre une session, puis
// redirige vers /completer-inscription si c'est un nouveau compte (pas
// encore de ligne User applicative — consentements RGPD/santé non recueillis),
// ou vers `redirect_to` si présent et validé (ex: coach revenant du lien
// "Valider le programme" reçu par email, 11/08/2026), sinon /dashboard.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnTo = sanitizeReturnTo(searchParams.get("redirect_to"));

  if (!code) {
    return NextResponse.redirect(`${origin}/sign-in`);
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/sign-in?error=oauth`);
  }

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: data.user.id } });
  if (!user) {
    const completionUrl = new URL("/completer-inscription", origin);
    if (returnTo) completionUrl.searchParams.set("redirect_to", returnTo);
    return NextResponse.redirect(completionUrl);
  }

  return NextResponse.redirect(`${origin}${returnTo ?? "/dashboard"}`);
}
