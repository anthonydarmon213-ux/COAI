import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { stripe } from "@/lib/stripe/client";
import { upsertStripeSubscription } from "@/lib/stripe/subscription-sync";

// Filet de sécurité post-checkout : le webhook reste la source normale,
// mais le client qui revient de Stripe ne dépend plus de sa latence pour
// obtenir immédiatement l'accès qu'il vient d'activer.
export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const sessionId = body && typeof body.sessionId === "string" ? body.sessionId : "";
  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Session Stripe invalide" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["subscription"] });
  if (
    session.status !== "complete" ||
    session.mode !== "subscription" ||
    session.client_reference_id !== user.id ||
    !session.subscription
  ) {
    return NextResponse.json({ error: "Paiement non confirmé" }, { status: 409 });
  }

  const subscription = typeof session.subscription === "string"
    ? await stripe.subscriptions.retrieve(session.subscription)
    : session.subscription;

  if (!(await upsertStripeSubscription(subscription, user.id))) {
    return NextResponse.json({ error: "Ce lien correspond à un ancien abonnement. Retrouve ton abonnement actuel dans ton compte." }, { status: 409 });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { checkoutReminderSentAt: new Date() },
  });

  // Une ancienne session complète peut correspondre à un abonnement qui
  // n'est plus actif. Confirmer la synchronisation ne promet pas des droits.
  const saved = await prisma.subscription.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    confirmed: true,
    accessActive: saved?.stripeSubscriptionId === subscription.id && saved.status === "ACTIVE",
  }, { headers: { "Cache-Control": "private, no-store" } });
}
