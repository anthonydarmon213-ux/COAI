import { NextResponse } from "next/server";
import { prixTrimestreCentimes } from "@/lib/pricing/offre-rentree";
import { getCurrentUser } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

// Historique : Pass IA était passé en annuel à 49€/an le 21/08/2026 pour
// rivaliser en volume avec les apps IA seule. Repositionnement premium le
// 22/08/2026 (ci-dessous), qui remonte le tarif et rétablit le choix du
// rythme de facturation.
// Tarifs (22/08/2026, repositionnement premium demandé par Anthony) :
// Pass IA passe de 49€/an à 19,99€/mois, avec une option annuelle à 119€/an
// (soit 9,99€/mois) — le choix mensuel/annuel est désormais réellement
// proposé, alors que le paramètre "billing" envoyé par SubscribeButton
// était jusqu'ici ignoré côté serveur.
const offresParPlan = () => ({
  PASS_IA: {
    name: "COAI — Full IA",
    trialDays: 7,
    MONTHLY: { amount: 1999, interval: "month", count: 1 },
    // 49 € les 3 mois, soit 16,33 €/mois : assez proche du mensuel pour ne
    // pas cannibaliser l'annuel, deja remise de moitie.
    // Prix lu a chaque demande : l'offre de rentree le ramene a 39 €
    // jusqu'au 30 septembre, puis il revient a 49 € sans intervention.
    QUARTERLY: { amount: prixTrimestreCentimes(), interval: "month", count: 3 },
    ANNUAL: { amount: 11900, interval: "year", count: 1 },
  },
}) as const;

// PREMIUM (Full Présentiel VIP) a ete retire de la vente en ligne le
// 02/09/2026 : il se vend desormais a la seance (200 euros puis devis) et se
// conclut sur WhatsApp. STANDARD (ex-"Coaching Hybride", devenu Full Remote
// le 04/09/2026 — cf. src/lib/pricing/tiers.ts) suit le meme chemin : sur
// devis via WhatsApp, jamais de checkout Stripe en ligne (decision confirmee
// par Anthony, aucun abonne actif sur ce plan au moment du changement). Les
// deux valeurs restent dans l'enum Prisma et dans les libelles pour ne pas
// casser les comptes qui les portent deja, mais aucun nouveau checkout ne
// peut plus les creer.

type Plan = keyof ReturnType<typeof offresParPlan>;

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  // Une demande PREMIUM ou STANDARD est refusee plutot que rabattue
  // silencieusement sur une autre formule : mieux vaut une erreur explicite
  // qu'un client facture pour un plan qu'il n'a pas choisi.
  if (body.plan === "PREMIUM") {
    return NextResponse.json(
      { error: "Le Full Présentiel VIP ne se souscrit plus en ligne : 200 € la séance, puis sur devis." },
      { status: 400 }
    );
  }
  if (body.plan === "STANDARD") {
    return NextResponse.json(
      { error: "Le Full Remote ne se souscrit plus en ligne : 1 200 € les 3 mois (soit 400 €/mois), sur devis via WhatsApp." },
      { status: 400 }
    );
  }

  const plan: Plan = "PASS_IA";
  const planConfig = offresParPlan()[plan];
  // Seul Pass IA propose réellement les deux rythmes ; pour les autres, les
  // deux entrées pointent sur le même tarif mensuel, donc un "ANNUAL"
  // envoyé par erreur ne peut pas facturer un montant inattendu.
  // Seul Pass IA propose reellement les trois rythmes ; pour les autres les
  // trois entrees pointent sur le meme tarif mensuel, donc une valeur
  // inattendue ne peut pas facturer un montant surprise.
  const billing: "MONTHLY" | "QUARTERLY" | "ANNUAL" =
    body.billing === "ANNUAL" ? "ANNUAL" : body.billing === "QUARTERLY" ? "QUARTERLY" : "MONTHLY";
  const tarif = planConfig[billing];
  const offer = { name: planConfig.name, trialDays: planConfig.trialDays, ...tarif };

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { subscription: true },
  });
  if (!user) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return NextResponse.json({ error: "Configuration Stripe manquante" }, { status: 500 });

  const metadata = { plan, billing };
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{
      price_data: {
        currency: "eur",
        unit_amount: offer.amount,
        recurring: { interval: offer.interval, interval_count: offer.count },
        product_data: {
          name: offer.name,
          description: offer.interval === "year"
            ? "Personal Training réimaginé — 119€ facturés une fois par an, résiliable à tout moment."
            : "Personal Training réimaginé — accompagnement mensuel sans engagement, résiliable à tout moment.",
        },
      },
      quantity: 1,
    }],
    ...(user.subscription?.stripeCustomerId
      ? { customer: user.subscription.stripeCustomerId }
      : { customer_email: authUser.email }),
    client_reference_id: user.id,
    success_url: `${appUrl}/bienvenue?plan=${plan}&billing=${billing}`,
    // Seul PASS_IA passe encore par ce checkout (STANDARD et PREMIUM sont
    // rejetés plus haut, sur devis via WhatsApp) : l'ancre est donc toujours
    // "pass-ia".
    cancel_url: `${appUrl}/pricing?checkout=cancel&selected=${plan}&billing=${billing}#pass-ia`,
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
