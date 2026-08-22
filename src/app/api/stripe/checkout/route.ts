import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

// Pass IA passe en facturation annuelle (21/08/2026, demande Anthony —
// "je veux faire du volume sur cette offre") : 49€ une fois par an
// (≈4,08€/mois) au lieu de 49€/mois, pour rivaliser avec les apps IA seule
// du marché (Reboot Plan : 39,99€/an) plutôt que de perdre la comparaison
// directe sur un tier qui n'a pas de coach humain à opposer. Coaching Hybride
// et VIP restent mensuels — c'est volontairement seulement Pass IA qui
// change, cf. discussion pricing du jour.
const OFFER_BY_PLAN = {
  GRATUIT: { name: "COAI — Pass IA", amount: 4900, interval: "year", trialDays: 7 },
  STANDARD: { name: "COAI — Coaching Hybride", amount: 8900, interval: "month", trialDays: 7 },
  PREMIUM: { name: "COAI — VIP", amount: 19900, interval: "month", trialDays: 0 },
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

  const billing = offer.interval === "year" ? "ANNUAL" : "MONTHLY";
  const metadata = { plan, billing, vipSessions: String(vipSessions) };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{
      price_data: {
        currency: "eur",
        unit_amount: offer.amount,
        recurring: { interval: offer.interval },
        product_data: {
          name: offer.name,
          description: plan === "PREMIUM"
            ? `${vipSessions} séance${vipSessions > 1 ? "s" : ""} privée${vipSessions > 1 ? "s" : ""} par mois — visio ou Paris centre.`
            : offer.interval === "year"
              ? "Personal Training réimaginé — 49€ facturés une fois par an, résiliable à tout moment."
              : "Personal Training réimaginé — accompagnement mensuel résiliable à tout moment.",
        },
      },
      quantity: vipSessions,
    }],
    ...(user.subscription?.stripeCustomerId
      ? { customer: user.subscription.stripeCustomerId }
      : { customer_email: authUser.email }),
    client_reference_id: user.id,
    success_url: `${appUrl}/bienvenue?plan=${plan}&billing=${billing}`,
    cancel_url: `${appUrl}/pricing?checkout=cancel`,
    // Acceptation des CGV déplacée ici (21/08/2026, audit tunnel demandé par
    // Anthony, point #7 : la case à cocher sur /pricing bloquait chaque
    // bouton avant même la décision, "alourdit la comparaison des offres").
    // Stripe Checkout affiche nativement une case "J'accepte les conditions"
    // avec lien vers l'URL de CGV configurée sur le compte Stripe — ne
    // fonctionne que si Réglages Stripe → Informations publiques →
    // "Conditions d'utilisation" pointe vers coai.fr/cgv (à vérifier/régler
    // une fois dans le dashboard Stripe, hors de portée d'un déploiement de
    // code). Les boutons /pricing restent immédiatement cliquables.
    consent_collection: { terms_of_service: "required" },
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
      checkoutBillingInterval: billing, checkoutReminderSentAt: null,
    },
  });

  return NextResponse.json({ url: session.url });
}
