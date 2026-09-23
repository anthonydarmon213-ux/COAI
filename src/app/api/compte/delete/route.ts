import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { createSupabaseAdminClient } from "@/lib/auth/admin";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";
import { deleteAllProgressPhotos } from "@/lib/storage/progress-photos";

// RGPD — droit à l'effacement : résilie l'abonnement Stripe, supprime le compte
// et toutes les données liées (cascade Prisma), puis l'identité Supabase Auth.
export async function POST(request: Request) {
  // Custom header cannot be sent by a cross-site HTML form. Do not add
  // permissive CORS here. This is request provenance, NOT authentication.
  if (request.headers.get("x-coai-delete-confirmation") !== "1") {
    return NextResponse.json({ error: "Rouvre les paramètres du compte pour confirmer la suppression." }, { status: 403 });
  }
  const authorization = request.headers.get("authorization");
  if (authorization !== null && !/^Bearer \S+$/.test(authorization)) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (authorization === null) {
    let expectedOrigin: string;
    try {
      const app = new URL(process.env.NEXT_PUBLIC_APP_URL || "");
      if (app.username || app.password || (app.protocol !== "https:" &&
          !(app.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(app.hostname)))) throw Error();
      expectedOrigin = app.origin;
    } catch {
      return NextResponse.json({ error: "Service indisponible. Réessaie dans quelques instants." }, { status: 503 });
    }
    // Never derive the trusted origin from Host / X-Forwarded-Host.
    if (request.headers.get("origin") !== expectedOrigin || request.headers.get("sec-fetch-site") === "cross-site") {
      return NextResponse.json({ error: "Origine non autorisée." }, { status: 403 });
    }
  }
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { subscription: true },
  });

  // Auth may still exist after a previous request removed the application
  // profile but failed to remove the identity. Keep that request retryable.
  if (user?.subscription?.stripeSubscriptionId) {
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

  try {
    await deleteAllProgressPhotos(authUser.id);
  } catch {
    return NextResponse.json({ error: "La suppression des photos n’a pas pu être confirmée. Ton compte n’a pas été supprimé. Certaines photos peuvent déjà avoir été effacées. Réessaie ou contacte l’assistance." }, { status: 503 });
  }

  if (user) {
    try {
      await prisma.user.delete({ where: { id: user.id } });
    } catch {
      return NextResponse.json({ error: "La suppression du profil n’a pas pu être confirmée. Certaines données peuvent déjà avoir été effacées. Réessaie ou contacte l’assistance." }, { status: 503 });
    }
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.deleteUser(authUser.id);
    if (error || data.user?.id !== authUser.id) throw new Error("identity_deletion_unconfirmed");
  } catch {
    return NextResponse.json({ error: "Tes données de profil ont été effacées, mais la suppression de ton accès n’a pas pu être confirmée. Réessaie pour terminer ou contacte l’assistance." }, { status: 503 });
  }

  return NextResponse.json({ success: true });
}
