import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

const OFFER_BY_PLAN = {
  GRATUIT: { name: "COAI — Impulsion", amount: 4900, trialDays: 7 },
  STANDARD: { name: "COAI — Transformation", amount: 8900, trialDays: 7 },
  PREMIUM: { name: "COAI — VIP", amount: 19900, trialDays: 0 },
} as const;

type Plan = keyof typeof OFFER_BY_PLAN;

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const plan: Plan = body.plan === "PREMIUM" ? "PREMIUM" : body.plan === "GRATUIT" ? "GRATUIT" : "STANDARD";
  const vipSessions = plan === "PREMIUM" && [1, 2, 3, 4].includes(Number(body.vipSessions))
    ? Number(body.vipSessions)
    : 1;
  const offer = OFFER_BY_PLAN[plan];

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { subscription: true },
  });
  if (!user) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return NextResponse.json({ error: "Configuration Stripe manquante" }, { status: 500 });

  const metadata = { plan, billing: "MONTHLY", vipSessions: String(vipSessions) };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{
      price_data: {
        currency: "eur",
        unit_amount: offer.amount,
        recurring: { interval: "month" },
        product_data: {
          name: offer.name,
          description: plan === "PREMIUM"
            ? `${vipSessions} séance${vipSessions > 1 ? "s" : ""} privée${vipSessions > 1 ? "s" : ""} par mois — visio ou Paris centre.`
            : "Personal Training réimaginé — accompagnement mensuel résiliable à tout moment.",
        },
      },
      quantity: vipSessions,
    }],
    ...(user.subscription?.stripeCustomerId
      ? { customer: user.subscription.stripeCustomerId }
      : { customer_email: authUser.email }),
    client_reference_id: user.id,
    success_url: `${appUrl}/bienvenue?plan=${plan}&billing=MONTHLY`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
    subscription_data: {
      metadata,
      ...(offer.trialDays ? { trial_period_days: offer.trialDays } : {}),
    },
    ...(offer.trialDays ? { payment_method_collection: "always" as const } : {}),
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      checkoutStartedAt: new Date(), checkoutPlan: plan,
      checkoutBillingInterval: "MONTHLY", checkoutReminderSentAt: null,
    },
  });

  return NextResponse.json({ url: session.url });
}
