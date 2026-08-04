import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { isValidWhatsappWebhookRequest } from "@/lib/whatsapp/client";
import { prisma } from "@/lib/db/client";

// Reçoit les événements poussés par le scénario Make.com de l'assistant WhatsApp
// existant (Coaching 2.0) : ex. poids loggé par message, ressenti de séance.
// Ne remplace pas le chat (décision actée) : simple synchronisation de données.
//
// Contrat attendu côté Make.com (POST, header x-webhook-secret) :
// { "phoneWhatsapp": "+33612345678", "event": "mesure" | "seance" | "message", "data": {...} }

const bodySchema = z.object({
  phoneWhatsapp: z.string().min(6),
  event: z.enum(["mesure", "seance", "message"]),
  data: z.record(z.unknown()).default({}),
});

const mesureDataSchema = z.object({
  date: z.coerce.date().optional(),
  poidsKg: z.number().positive().max(500).optional(),
  tourTailleCm: z.number().positive().max(300).optional(),
  masseGrassePourcent: z.number().min(0).max(100).optional(),
  masseMusculaireKg: z.number().positive().max(200).optional(),
  frequenceCardiaqueReposBpm: z.number().int().min(20).max(220).optional(),
  notes: z.string().max(2000).optional(),
});

const seanceDataSchema = z.object({
  date: z.coerce.date().optional(),
  exercices: z.array(z.record(z.unknown())).optional(),
  ressenti: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  if (!isValidWhatsappWebhookRequest(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { phoneWhatsapp, event, data } = parsed.data;

  const user = await prisma.user.findUnique({ where: { phoneWhatsapp } });
  if (!user) {
    return NextResponse.json({ error: "Aucun compte associé à ce numéro" }, { status: 404 });
  }

  await prisma.whatsAppEvent.create({
    data: {
      userId: user.id,
      direction: "INBOUND",
      payload: { event, data } as Prisma.InputJsonValue,
    },
  });

  if (event === "mesure") {
    const mesure = mesureDataSchema.safeParse(data);
    if (!mesure.success) {
      return NextResponse.json({ error: mesure.error.flatten() }, { status: 400 });
    }
    await prisma.mesure.create({
      data: { userId: user.id, date: mesure.data.date ?? new Date(), ...mesure.data },
    });
  } else if (event === "seance") {
    const seance = seanceDataSchema.safeParse(data);
    if (!seance.success) {
      return NextResponse.json({ error: seance.error.flatten() }, { status: 400 });
    }
    await prisma.seanceLog.create({
      data: {
        userId: user.id,
        date: seance.data.date ?? new Date(),
        exercices: (seance.data.exercices ?? []) as Prisma.InputJsonValue,
        ressenti: seance.data.ressenti,
        notes: seance.data.notes,
      },
    });
  }
  // "message" : uniquement tracé via WhatsAppEvent ci-dessus, pas d'écriture supplémentaire.

  return NextResponse.json({ received: true });
}
