import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { stripe } from "@/lib/stripe/client";
import { PROGRAMMES_PRETS } from "@/lib/programmes-prets/catalogue";
import { PROGRAMME_UNITAIRE_PRIX_CENTS } from "@/lib/programmes-prets/offre";
import { hasProgrammeAccess } from "@/lib/subscription/plan";

const programmeParSlug = new Map(PROGRAMMES_PRETS.map((programme) => [programme.slug, programme]));

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser?.email) {
    return NextResponse.json({ error: "Connecte-toi pour acheter ce programme." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    programmePrincipal?: unknown;
    programmeOffert?: unknown;
    consentAccesImmediat?: unknown;
  };
  if (typeof body.programmePrincipal !== "string" || typeof body.programmeOffert !== "string") {
    return NextResponse.json({ error: "Sélection de programmes invalide." }, { status: 400 });
  }
  if (body.programmePrincipal === body.programmeOffert) {
    return NextResponse.json({ error: "Choisis un deuxième programme différent." }, { status: 400 });
  }
  if (body.consentAccesImmediat !== true) {
    return NextResponse.json({ error: "Ton accord est requis pour l'accès immédiat." }, { status: 400 });
  }

  const principal = programmeParSlug.get(body.programmePrincipal);
  const offert = programmeParSlug.get(body.programmeOffert);
  if (!principal || !offert) {
    return NextResponse.json({ error: "Programme introuvable." }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { subscription: true, programmePurchases: true },
  });
  if (!user) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  if (hasProgrammeAccess(user, user.subscription)) {
    return NextResponse.json({ error: "Tous les programmes sont déjà inclus dans ton accès COAI." }, { status: 409 });
  }

  const dejaAchetes = new Set(
    user.programmePurchases.flatMap((achat) => [achat.programmePrincipal, achat.programmeOffert])
  );
  if (dejaAchetes.has(principal.slug) || dejaAchetes.has(offert.slug)) {
    return NextResponse.json({ error: "L'un des programmes choisis est déjà dans ta bibliothèque." }, { status: 409 });
  }

  const appUrlValue = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrlValue) {
    return NextResponse.json({ error: "Configuration Stripe manquante." }, { status: 500 });
  }
  let appUrl: string;
  try {
    appUrl = new URL(appUrlValue).origin;
  } catch {
    return NextResponse.json({ error: "Configuration du site invalide." }, { status: 500 });
  }

  const metadata = {
    programmePurchase: "UNITAIRE_RENTREE",
    programmePrincipal: principal.slug,
    programmeOffert: offert.slug,
    offre: "UN_ACHETE_UN_OFFERT",
    consentAccesImmediat: "OUI",
    cgvVersion: "2026-08-27",
  };
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    locale: "fr",
    line_items: [{
      price_data: {
        currency: "eur",
        unit_amount: PROGRAMME_UNITAIRE_PRIX_CENTS,
        product_data: {
          name: "COAI — Pack 2 programmes · Tarif lancement",
          description: `${principal.nom} + ${offert.nom} offert. Accès permanent, sans abonnement.`,
        },
      },
      quantity: 1,
    }],
    ...(user.subscription?.stripeCustomerId
      ? { customer: user.subscription.stripeCustomerId }
      : { customer_email: authUser.email }),
    client_reference_id: user.id,
    metadata,
    payment_intent_data: { metadata },
    consent_collection: { terms_of_service: "required" },
    success_url: `${appUrl}/boutique?achat=success`,
    cancel_url: `${appUrl}/boutique?achat=cancel`,
  });

  return NextResponse.json({ url: session.url });
}
