import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

const PRICE_ENV_BY_PLAN = {
  STANDARD: "STRIPE_PRICE_ID_MONTHLY",
  PREMIUM: "STRIPE_PRICE_ID_PREMIUM",
} as const;

// Crée une session Stripe Checkout pour l'abonnement STANDARD (49€/mois) ou
// PREMIUM (199€/mois), sans engagement.
// client_reference_id porte l'id User applicatif, utilisé par le webhook pour
// relier la subscription Stripe à l'utilisateur.
export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser || !authUser.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const plan = body.plan === "PREMIUM" ? "PREMIUM" : "STANDARD";

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const priceId = process.env[PRICE_ENV_BY_PLAN[plan]];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!priceId || !appUrl) {
    return NextResponse.json({ error: "Configuration Stripe manquante" }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: authUser.email,
    client_reference_id: user.id,
    success_url: `${appUrl}/dashboard?checkout=success`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
  });

  return NextResponse.json({ url: session.url });
}
