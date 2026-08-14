import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";

const VIP_PACKS = {
  VISIO: {
    priceEnv: "STRIPE_PRICE_ID_VIP_VISIO_PACK",
    label: "Pack VIP Visio — 4 séances",
  },
  PRESENTIEL: {
    priceEnv: "STRIPE_PRICE_ID_VIP_PRESENTIEL_PACK",
    label: "Pack VIP Présentiel — 4 séances",
  },
} as const;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pack = body.pack === "PRESENTIEL" ? "PRESENTIEL" : body.pack === "VISIO" ? "VISIO" : null;
  if (!pack) {
    return NextResponse.json({ error: "Pack VIP invalide" }, { status: 400 });
  }

  const configuration = VIP_PACKS[pack];
  const priceId = process.env[configuration.priceEnv];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!priceId || !appUrl) {
    return NextResponse.json({ error: "Configuration Stripe manquante" }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/pricing?vip=success&pack=${pack}#vip`,
    cancel_url: `${appUrl}/pricing?vip=cancel#vip`,
    metadata: { vipPack: pack, vipPackLabel: configuration.label },
    payment_intent_data: { metadata: { vipPack: pack } },
  });

  return NextResponse.json({ url: session.url });
}
