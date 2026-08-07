import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
    case "unpaid":
      return "PAST_DUE";
    case "canceled":
      return "CANCELED";
    default:
      return "INCOMPLETE";
  }
}

// Déduit le palier (STANDARD/PREMIUM) à partir du price Stripe de la ligne
// d'abonnement, en comparant aux ids configurés en env.
function mapStripePlan(subscription: Stripe.Subscription): SubscriptionPlan {
  const priceId = subscription.items.data[0]?.price.id;
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_PREMIUM) return "PREMIUM";
  return "STANDARD";
}

async function upsertFromSubscription(subscription: Stripe.Subscription, userId?: string) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const data = {
    stripeSubscriptionId: subscription.id,
    status: mapStripeStatus(subscription.status),
    plan: mapStripePlan(subscription),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };

  if (userId) {
    await prisma.subscription.upsert({
      where: { stripeCustomerId: customerId },
      update: data,
      create: { userId, stripeCustomerId: customerId, ...data },
    });
    return;
  }

  // customer.subscription.updated/deleted ne porte pas de userId. Stripe ne
  // garantit pas l'ordre des événements : si celui-ci arrive avant
  // checkout.session.completed, la ligne n'existe pas encore — on l'ignore
  // silencieusement (pas d'erreur, updateMany ne matche simplement rien) et
  // checkout.session.completed créera la ligne avec le statut déjà à jour.
  await prisma.subscription.updateMany({ where: { stripeCustomerId: customerId }, data });
}

// Webhook Stripe : synchronise le statut et le palier d'abonnement avec le
// modèle Subscription.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Configuration webhook manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (userId && session.subscription) {
        const subscriptionId =
          typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertFromSubscription(subscription, userId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await upsertFromSubscription(subscription);
      break;
    }
    // Un remboursement n'annule pas l'abonnement côté Stripe par défaut —
    // on force l'annulation immédiate dès qu'un paiement lié est remboursé,
    // pour éviter un accès qui continue après remboursement.
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const invoiceId = typeof charge.invoice === "string" ? charge.invoice : charge.invoice?.id;
      if (invoiceId) {
        const invoice = await stripe.invoices.retrieve(invoiceId);
        const subscriptionId =
          typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
        if (subscriptionId) {
          const canceled = await stripe.subscriptions.cancel(subscriptionId);
          await upsertFromSubscription(canceled);
        }
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
