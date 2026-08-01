import { NextResponse } from "next/server";
import { isValidWhatsappWebhookRequest } from "@/lib/whatsapp/client";
import { prisma } from "@/lib/db/client";

// Reçoit les événements poussés par le scénario Make.com de l'assistant WhatsApp
// existant (Coaching 2.0) : ex. poids loggé par message, ressenti de séance.
// Ne remplace pas le chat (décision actée) : simple synchronisation de données.
export async function POST(request: Request) {
  if (!isValidWhatsappWebhookRequest(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const payload = await request.json();

  // TODO: router selon payload.event vers prisma.mesure.create / prisma.seanceLog.create,
  // et tracer l'échange dans prisma.whatsAppEvent
  void prisma;
  void payload;

  return NextResponse.json({ received: true });
}
