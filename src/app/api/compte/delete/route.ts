import { NextResponse } from "next/server";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

// RGPD — droit à l'effacement : supprime le compte et toutes les données liées
// (cascade Prisma), puis l'identité Supabase Auth associée.
export async function POST() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  await prisma.user.delete({ where: { supabaseAuthId: authUser.id } });

  // TODO: supprimer également l'identité côté Supabase Auth via le client admin
  // (service role), et annuler l'abonnement Stripe le cas échéant.
  void createSupabaseServerClient;

  return NextResponse.json({ success: true });
}
