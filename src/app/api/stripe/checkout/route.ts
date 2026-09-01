import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

// Historique : Pass IA était passé en annuel à 49€/an le 21/08/2026 pour
// rivaliser en volume avec les apps IA seule. Repositionnement premium le
// 22/08/2026 (ci-dessous), qui remonte le tarif et rétablit le choix du
// rythme de facturation.
// Tarifs (22/08/2026, repositionnement premium demandé par Anthony) :
// Pass IA passe de 49€/an à 19,99€/mois, avec une option annuelle à 119€/an
// (soit environ 9,92€/mois) — le choix mensuel/annuel est désormais réellement
// proposé, alors que le paramètre "billing" envoyé par SubscribeButton
// était jusqu'ici ignoré côté serveur.
const OFFER_BY_PLAN = {
  GRATUIT: {
    name: "COAI — Pass IA",
    trialDays: 7,
    MONTHLY: { amount: 1999, interval: "month" },
    ANNUAL: { amount: 11900, interval: "year" },
  },
  STANDARD: {
    name: "COAI — Coaching Hybride",
    trialDays: 7,
    MONTHLY: { amount: 9900, interval: "month" },
    ANNUAL: { amount: 9900, interval: "month" },
  },
  PREMIUM: {
    name: "COAI — VIP",
    trialDays: 0,
    MONTHLY: { amount: 19900, interval: "month" },
    ANNUAL: { amount: 19900, interval: "month" },
  },
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
  const planConfig = OFFER_BY_PLAN[plan];
  // Seul Pass IA propose réellement les deux rythmes ; pour les autres, les
  // deux entrées pointent sur le même tarif mensuel, donc un "ANNUAL"
  // envoyé par erreur ne peut pas facturer un montant inattendu.
  const billing: "MONTHLY" | "ANNUAL" =
    plan === "GRATUIT" && body.billing === "ANNUAL" ? "ANNUAL" : "MONTHLY";
  const tarif = planConfig[billing];
  const offer = { name: planConfig.name, trialDays: planConfig.trialDays, ...tarif };

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { subscription: true },
  });
  if (!user) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return NextResponse.json({ error: "Configuration Stripe manquante" }, { status: 500 });

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
              ? "Personal Training réimaginé — 119€ facturés une fois par an. Renouvellement annulable à tout moment ; accès maintenu jusqu'à la fin de la période réglée."
              : "Personal Training réimaginé — accompagnement mensuel sans engagement, résiliable à tout moment.",
        },
      },
      quantity: vipSessions,
    }],
    ...(user.subscription?.stripeCustomerId
      ? { customer: user.subscription.stripeCustomerId }
      : { customer_email: authUser.email }),
    client_reference_id: user.id,
    success_url: `${appUrl}/bienvenue?plan=${plan}&billing=${billing}`,
    cancel_url: `${appUrl}/pricing?checkout=cancel&selected=${plan}&billing=${billing}#${plan === "GRATUIT" ? "pass-ia" : plan === "STANDARD" ? "coaching-hybride" : "vip"}`,
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
