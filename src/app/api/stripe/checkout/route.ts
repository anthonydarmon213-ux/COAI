import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

const PRICE_ENV_BY_PLAN = {
  GRATUIT: "STRIPE_PRICE_ID_GRATUIT",
  STANDARD: "STRIPE_PRICE_ID_MONTHLY",
  PREMIUM: "STRIPE_PRICE_ID_PREMIUM",
} as const;

// Crée une session Stripe Checkout. GRATUIT (affiché "Impulsion", offre
// d'appel, 7 jours offerts puis 19€/mois) et STANDARD (affiché
// "Transformation", 7 jours offerts puis 49€/mois, décision d'Anthony du
// 10/08/2026 d'étendre l'essai aux deux offres) passent par un essai
// Stripe avec carte obligatoire dès l'inscription —
// payment_method_collection: "always" force la saisie de la CB même si la
// première facture est à 0€. Le body peut passer skipTrial: true (proposé
// à l'inscription pour qui ne veut pas attendre 7 jours, sur les deux
// offres depuis le 11/08/2026) pour facturer immédiatement au lieu de
// passer par l'essai — même price, juste sans trial_period_days ; le
// programme se débloque alors dès le paiement (cf. isInTrial côté
// génération, qui bloque déjà la génération pendant l'essai quel que soit
// le palier). PREMIUM (ancienne offre 199€/mois) n'est plus exposé sur
// /pricing, reste géré ici pour d'éventuels abonnés existants, et ne passe
// jamais par un essai.
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
  const skipTrial = plan !== "PREMIUM" && body.skipTrial === true;

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
    success_url: `${appUrl}/bienvenue?plan=${plan}${skipTrial ? "&essai=0" : ""}`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
    ...(plan !== "PREMIUM" && !skipTrial
      ? {
          subscription_data: { trial_period_days: 7 },
          payment_method_collection: "always" as const,
        }
      : {}),
  });

  return NextResponse.json({ url: session.url });
}
