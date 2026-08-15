import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

const bodySchema = z.object({
  offer: z.enum(["PROGRAMME", "COACH", "BUNDLE"]).default("PROGRAMME"),
});

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Offre invalide" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { subscription: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const programmePriceId = process.env.STRIPE_PRICE_ID_PROGRAMME_ONE_SHOT;
  const coachPriceId =
    process.env.STRIPE_PRICE_ID_COACH_IA_MONTHLY ?? process.env.STRIPE_PRICE_ID_GRATUIT;
  const bundleSetupPriceId = process.env.STRIPE_PRICE_ID_PROGRAMME_BUNDLE_SETUP;
  const offer = parsed.data.offer;

  if (!appUrl || !programmePriceId || !coachPriceId) {
    return NextResponse.json({ error: "Configuration Stripe manquante" }, { status: 500 });
  }
  if (offer === "PROGRAMME" && user.programmeUnlockedAt) {
    return NextResponse.json({ error: "Programme déjà débloqué" }, { status: 400 });
  }
  if (offer === "BUNDLE" && !user.programmeUnlockedAt && !bundleSetupPriceId) {
    return NextResponse.json({ error: "Configuration du pack Stripe manquante" }, { status: 500 });
  }

  const common = {
    customer: user.subscription?.stripeCustomerId,
    customer_email: user.subscription?.stripeCustomerId ? undefined : authUser.email,
    client_reference_id: user.id,
    success_url: `${appUrl}/bienvenue?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
  };

  if (offer === "PROGRAMME") {
    const session = await stripe.checkout.sessions.create({
      ...common,
      mode: "payment",
      line_items: [{ price: programmePriceId, quantity: 1 }],
      metadata: {
        oneShotProgramme: "IMPULSION",
        checkoutKind: "PROGRAMME_ONE_SHOT",
        plan: "GRATUIT",
      },
    });
    return NextResponse.json({ url: session.url });
  }

  const includesProgramme = offer === "BUNDLE" && !user.programmeUnlockedAt;
  const session = await stripe.checkout.sessions.create({
    ...common,
    mode: "subscription",
    line_items: [
      { price: coachPriceId, quantity: 1 },
      ...(includesProgramme && bundleSetupPriceId
        ? [{ price: bundleSetupPriceId, quantity: 1 }]
        : []),
    ],
    metadata: {
      checkoutKind: includesProgramme ? "IMPULSION_BUNDLE" : "COACH_IA_SUBSCRIPTION",
      includesProgramme: includesProgramme ? "1" : "0",
      plan: "GRATUIT",
    },
    subscription_data: {
      metadata: {
        appUserId: user.id,
        plan: "GRATUIT",
        billing: "MONTHLY",
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
