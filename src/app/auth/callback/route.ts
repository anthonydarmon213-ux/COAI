import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

// Point d'atterrissage du flow OAuth (ex: Google) initié par
// supabase.auth.signInWithOAuth. Échange le code contre une session, puis
// redirige vers /completer-inscription si c'est un nouveau compte (pas
// encore de ligne User applicative — consentements RGPD/santé non recueillis),
// ou directement vers /dashboard si le compte existe déjà.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

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
    return NextResponse.redirect(`${origin}/completer-inscription`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
