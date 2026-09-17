import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/auth/admin";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";
import { deleteAllProgressPhotos } from "@/lib/storage/progress-photos";

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
    try {
      const subscription = await stripe.subscriptions.retrieve(user.subscription.stripeSubscriptionId);
      const customerId = typeof subscription.customer === "string"
        ? subscription.customer : subscription.customer.id;
      if (customerId !== user.subscription.stripeCustomerId) throw new Error("customer_mismatch");
      // A network error or a missing resource is NOT proof of cancellation.
      // Retrieve first so an already-canceled subscription can safely be retried.
      if (subscription.status !== "canceled" && subscription.status !== "incomplete_expired") {
        const canceled = await stripe.subscriptions.cancel(subscription.id);
        if (canceled.status !== "canceled") throw new Error("cancellation_unconfirmed");
      }
    } catch {
      return NextResponse.json({ error: "La résiliation n’a pas pu être confirmée. Ton profil est conservé. Réessaie ou contacte l’assistance." }, { status: 503 });
    }
  }

  await deleteAllProgressPhotos(authUser.id);

  await prisma.user.delete({ where: { id: user.id } });

  const admin = createSupabaseAdminClient();
  await admin.auth.admin.deleteUser(authUser.id);

  return NextResponse.json({ success: true });
}
