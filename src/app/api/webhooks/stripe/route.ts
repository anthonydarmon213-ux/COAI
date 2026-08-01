import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

// Webhook Stripe : synchronise le statut d'abonnement (checkout.session.completed,
// customer.subscription.updated/deleted) avec le modèle Subscription.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Configuration webhook manquante" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  // TODO: switch(event.type) { ... } → mettre à jour prisma.subscription
  void prisma;

  return NextResponse.json({ received: true });
}
