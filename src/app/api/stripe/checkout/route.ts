import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

const PRICE_ENV_BY_PLAN = {
  GRATUIT: "STRIPE_PRICE_ID_GRATUIT",
  STANDARD: "STRIPE_PRICE_ID_MONTHLY",
  PREMIUM: "STRIPE_PRICE_ID_PREMIUM",
} as const;

const ANNUAL_PRICE_ENV_BY_PLAN = {
  GRATUIT: "STRIPE_PRICE_ID_GRATUIT_ANNUAL",
  STANDARD: "STRIPE_PRICE_ID_STANDARD_ANNUAL",
} as const;

// Crée une session Stripe Checkout. GRATUIT (affiché "Impulsion", offre
// d'appel, 7 jours d'essai puis 19€/mois) et STANDARD (affiché
// "Transformation", 7 jours d'essai puis 49€/mois) passent par un essai
// Stripe avec carte obligatoire dès l'inscription —
// payment_method_collection: "always" force la saisie de la CB même si la
// première facture est à 0€.
//
// skipTrial (11/08/2026, correction Anthony) : Transformation n'a plus
// qu'un seul parcours possible, l'essai de 7 jours — jamais de facturation
// immédiate, quoi que le client envoie dans le body. Restreint ici
// explicitement à GRATUIT (`plan === "GRATUIT"`, pas juste `!== PREMIUM`)
// pour que ce ne soit pas seulement l'interface qui ait retiré le choix
// pour Transformation : impossible de contourner via un appel direct à
// cette route. GRATUIT garde la capacité côté backend même si son interface
// n'expose plus ce choix non plus (cf. sign-up/page.tsx) — capacité inerte,
// non un comportement actif, donc pas un changement pour Impulsion.
// PREMIUM (ancienne offre 199€/mois) n'est plus exposé sur /pricing, reste
// géré ici pour d'éventuels abonnés existants, et ne passe jamais par un
// essai (déjà exclu par `plan === "GRATUIT"` ci-dessous).
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
  const skipTrial = plan === "GRATUIT" && body.skipTrial === true;
  const billing = body.billing === "ANNUAL" && plan !== "PREMIUM" ? "ANNUAL" : "MONTHLY";

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { subscription: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const priceEnv = billing === "ANNUAL"
    ? ANNUAL_PRICE_ENV_BY_PLAN[plan as "GRATUIT" | "STANDARD"]
    : PRICE_ENV_BY_PLAN[plan];
  const priceId = process.env[priceEnv];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if ((!priceId && plan !== "STANDARD") || !appUrl) {
    return NextResponse.json({ error: "Configuration Stripe manquante" }, { status: 500 });
  }

  // Transformation est l'offre principale. Son montant est défini côté
  // serveur pour empêcher qu'un ancien Price ID Stripe affiche un tarif
  // différent de celui annoncé sur le site.
  const lineItem = plan === "STANDARD"
    ? {
        price_data: {
          currency: "eur",
          unit_amount: billing === "ANNUAL" ? 49000 : 4900,
          recurring: { interval: billing === "ANNUAL" ? "year" as const : "month" as const },
          product_data: {
            name: "COAI — Transformation",
            description: "Coaching humain augmenté par l'IA — 7 jours d'essai.",
          },
        },
        quantity: 1,
      }
    : { price: priceId as string, quantity: 1 };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [lineItem],
    // Réutilise le client Stripe déjà rattaché au compte. Sans cela, chaque
    // nouvelle ouverture de Checkout pouvait créer un doublon client.
    ...(user.subscription?.stripeCustomerId
      ? { customer: user.subscription.stripeCustomerId }
      : { customer_email: authUser.email }),
    client_reference_id: user.id,
    success_url: `${appUrl}/bienvenue?plan=${plan}&billing=${billing}${skipTrial ? "&essai=0" : ""}`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
    ...(plan !== "PREMIUM" && !skipTrial
      ? {
          subscription_data: { trial_period_days: 7, metadata: { plan, billing } },
          payment_method_collection: "always" as const,
        }
      : {}),
  });

  // Enregistré seulement après création réussie de la session Stripe. Cette
  // donnée sert à récupérer un Checkout abandonné, sans stocker de donnée CB.
  await prisma.user.update({
    where: { id: user.id },
    data: {
      checkoutStartedAt: new Date(),
      checkoutPlan: plan,
      checkoutBillingInterval: billing,
      checkoutReminderSentAt: null,
    },
  });

  return NextResponse.json({ url: session.url });
}
