import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/client";
import { prisma } from "@/lib/db/client";

// Ouvre le portail client Stripe (gestion moyen de paiement, résiliation
// sans engagement, factures).
export async function POST() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { subscription: true },
  });

  if (!user?.subscription?.stripeCustomerId) {
    return NextResponse.json({ error: "Aucun abonnement Stripe associé" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const session = await stripe.billingPortal.sessions.create({
    customer: user.subscription.stripeCustomerId,
    return_url: `${appUrl}/compte/abonnement`,
  });

  return NextResponse.json({ url: session.url });
}
