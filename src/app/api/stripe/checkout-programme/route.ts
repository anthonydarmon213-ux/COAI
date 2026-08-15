import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

// Déblocage "Impulsion" (13/08/2026, nouveau modèle d'accès libre) :
// paiement Stripe unique de 19€ pour générer son programme une fois, hors
// abonnement — même pattern que le pack VIP (mode "payment", pas
// "subscription"). Contrairement à /api/stripe/checkout (Transformation),
// aucun essai, aucune carte requise à l'avance en dehors du paiement
// lui-même.
export async function POST() {
  const authUser = await getCurrentUser();
  if (!authUser || !authUser.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  if (user.programmeUnlockedAt) {
    return NextResponse.json({ error: "Déjà débloqué" }, { status: 400 });
  }

  const priceId = process.env.STRIPE_PRICE_ID_PROGRAMME_ONE_SHOT;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!priceId || !appUrl) {
    return NextResponse.json({ error: "Configuration Stripe manquante" }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: authUser.email,
    client_reference_id: user.id,
    metadata: {
      oneShotProgramme: "IMPULSION",
      checkoutKind: "PROGRAMME_ONE_SHOT",
      plan: "GRATUIT",
    },
    success_url: `${appUrl}/bienvenue?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/dashboard?unlock=cancel`,
  });

  return NextResponse.json({ url: session.url });
}
