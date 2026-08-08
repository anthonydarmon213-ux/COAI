import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

const PRICE_ENV_BY_PLAN = {
  GRATUIT: "STRIPE_PRICE_ID_GRATUIT",
  STANDARD: "STRIPE_PRICE_ID_MONTHLY",
  PREMIUM: "STRIPE_PRICE_ID_PREMIUM",
} as const;

// Crée une session Stripe Checkout. GRATUIT (offre d'appel, 1 mois offert
// puis 9€/mois) passe par un essai Stripe avec carte obligatoire dès
// l'inscription — payment_method_collection: "always" force la saisie de
// la CB même si la première facture est à 0€. STANDARD (affiché "Premium",
// 49€/mois) est le palier payant sans engagement. PREMIUM (ancienne offre
// 199€/mois) n'est plus exposé sur /pricing mais reste géré ici pour
// d'éventuels abonnés existants.
// client_reference_id porte l'id User applicatif, utilisé par le webhook pour
// relier la subscription Stripe à l'utilisateur.
export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser || !authUser.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const plan =
    body.plan === "PREMIUM" ? "PREMIUM" : body.plan === "GRATUIT" ? "GRATUIT" : "STANDARD";

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
    success_url: `${appUrl}/bienvenue?plan=${plan}`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
    ...(plan === "GRATUIT"
      ? {
          subscription_data: { trial_period_days: 30 },
          payment_method_collection: "always" as const,
        }
      : {}),
  });

  return NextResponse.json({ url: session.url });
}
