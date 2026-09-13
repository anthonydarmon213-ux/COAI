import type Stripe from "stripe";
import type { BillingInterval, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { stripe } from "@/lib/stripe/client";

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
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

export function mapStripePlan(subscription: Stripe.Subscription): SubscriptionPlan {
  const metadataPlan = subscription.metadata?.plan;
  if (metadataPlan === "GRATUIT") return "PASS_IA";
  if (metadataPlan === "PASS_IA" || metadataPlan === "STANDARD" || metadataPlan === "PREMIUM") {
    return metadataPlan;
  }

  const priceId = subscription.items.data[0]?.price.id;
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_PREMIUM) return "PREMIUM";
  if (
    priceId &&
    (priceId === process.env.STRIPE_PRICE_ID_GRATUIT ||
      priceId === process.env.STRIPE_PRICE_ID_GRATUIT_ANNUAL)
  ) return "PASS_IA";
  return "STANDARD";
}

export function mapBillingInterval(subscription: Stripe.Subscription): BillingInterval {
  const recurring = subscription.items.data[0]?.price.recurring;
  if (recurring?.interval === "year") return "ANNUAL";
  if (recurring?.interval === "month" && recurring.interval_count === 3) return "QUARTERLY";
  return "MONTHLY";
}

export function getCurrentPeriodEnd(subscription: Stripe.Subscription): Date | null {
  const topLevel = (subscription as unknown as { current_period_end?: number }).current_period_end;
  if (typeof topLevel === "number") return new Date(topLevel * 1000);
  const item = subscription.items.data[0] as unknown as { current_period_end?: number } | undefined;
  if (typeof item?.current_period_end === "number") return new Date(item.current_period_end * 1000);
  return null;
}

export async function upsertStripeSubscription(subscription: Stripe.Subscription, userId?: string) {
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const price = subscription.items.data[0]?.price;
  const data = {
    stripeSubscriptionId: subscription.id,
    status: mapStripeStatus(subscription.status),
    plan: mapStripePlan(subscription),
    billingInterval: mapBillingInterval(subscription),
    amountCents: price?.unit_amount ?? null,
    currency: price?.currency?.toUpperCase() ?? null,
    currentPeriodEnd: getCurrentPeriodEnd(subscription),
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  };

  if (userId) {
    // A completed Checkout can be visited or delivered again months later.
    // Compare Stripe creation dates, never delivery time or lexical IDs.
    // Reads from Stripe stay outside database transactions. Conditional writes
    // retry if another confirmation has replaced the row in the meantime.
    for (let attempt = 0; attempt < 4; attempt++) {
      const current = await prisma.subscription.findUnique({ where: { userId } });
      if (!current) {
        try {
          await prisma.subscription.create({ data: { userId, stripeCustomerId: customerId, ...data } });
          return true;
        } catch (error) {
          if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") continue;
          throw error;
        }
      }
      if (current.stripeCustomerId !== customerId) {
        throw new Error("Checkout customer does not match the existing subscription");
      }
      if (current.stripeSubscriptionId && current.stripeSubscriptionId !== subscription.id) {
        const previous = await stripe.subscriptions.retrieve(current.stripeSubscriptionId);
        const previousCustomer = typeof previous.customer === "string" ? previous.customer : previous.customer.id;
        if (previousCustomer !== customerId) throw new Error("Subscription customer mismatch");
        if (!Number.isFinite(previous.created) || !Number.isFinite(subscription.created) || previous.created === subscription.created) {
          throw new Error("Cannot determine subscription order safely");
        }
        if (subscription.created < previous.created) return false;
      }
      const changed = await prisma.subscription.updateMany({
        where: { id: current.id, stripeSubscriptionId: current.stripeSubscriptionId, updatedAt: current.updatedAt },
        data,
      });
      if (changed.count > 0) return true;
    }
    throw new Error("Concurrent subscription confirmation; retry required");
  }

  const changed = await prisma.subscription.updateMany({ where: { stripeCustomerId: customerId,
    OR: [{ stripeSubscriptionId: subscription.id }, { stripeSubscriptionId: null }] }, data });
  return changed.count > 0;
}
