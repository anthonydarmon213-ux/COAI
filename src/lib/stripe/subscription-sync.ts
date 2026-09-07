import type Stripe from "stripe";
import type { BillingInterval, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/client";

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
    await prisma.subscription.upsert({
      where: { stripeCustomerId: customerId },
      update: { ...data, userId },
      create: { userId, stripeCustomerId: customerId, ...data },
    });
    return;
  }

  await prisma.subscription.updateMany({ where: { stripeCustomerId: customerId }, data });
}
