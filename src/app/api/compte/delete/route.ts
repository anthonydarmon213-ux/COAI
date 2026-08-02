import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/auth/admin";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

// RGPD — droit à l'effacement : résilie l'abonnement Stripe, supprime le compte
// et toutes les données liées (cascade Prisma), puis l'identité Supabase Auth.
export async function POST() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { subscription: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  if (user.subscription?.stripeSubscriptionId) {
    await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId).catch(() => {
      // déjà résiliée côté Stripe : on continue la suppression du compte
    });
  }

  await prisma.user.delete({ where: { id: user.id } });

  const admin = createSupabaseAdminClient();
  await admin.auth.admin.deleteUser(authUser.id);

  return NextResponse.json({ success: true });
}
