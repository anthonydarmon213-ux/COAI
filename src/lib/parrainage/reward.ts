import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

const COUPON_ID = "parrainage-1-mois-offert";

async function getOrCreateCoupon(): Promise<string> {
  try {
    await stripe.coupons.retrieve(COUPON_ID);
    return COUPON_ID;
  } catch {
    await stripe.coupons.create({
      id: COUPON_ID,
      name: "Parrainage — 1 mois offert",
      percent_off: 100,
      duration: "once",
    });
    return COUPON_ID;
  }
}

// Récompense de parrainage : quand un filleul passe payant (fin de son mois
// offert, transition trialing → active côté Stripe), son parrain reçoit
// 1 mois offert sur son propre abonnement. `recompenseParrainageAppliquee`
// (sur le filleul) empêche une notification Stripe rejouée de déclencher la
// récompense une deuxième fois.
export async function appliquerRecompenseParrainageSiEligible(
  subscription: Stripe.Subscription,
  statutPrecedent: string | undefined
) {
  if (statutPrecedent !== "trialing" || subscription.status !== "active") return;

  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const filleulSubscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
    include: { user: { include: { parrainePar: { include: { subscription: true } } } } },
  });

  const filleul = filleulSubscription?.user;
  const parrain = filleul?.parrainePar;
  if (!filleul || !parrain || filleul.recompenseParrainageAppliquee) return;
  if (!parrain.subscription?.stripeSubscriptionId) return;

  const couponId = await getOrCreateCoupon();
  await stripe.subscriptions.update(parrain.subscription.stripeSubscriptionId, {
    coupon: couponId,
  });

  await prisma.user.update({
    where: { id: filleul.id },
    data: { recompenseParrainageAppliquee: true },
  });
}
