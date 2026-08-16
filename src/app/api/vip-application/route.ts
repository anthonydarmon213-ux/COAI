import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification } from "@/lib/email/client";
import { buildWhatsAppLinkVersLead } from "@/lib/email/lead-notification";

const schema = z.object({
  prenom: z.string().trim().min(2).max(80),
  email: z.string().email().max(320),
  telephone: z.string().trim().min(8).max(30),
  objectif: z.string().trim().min(20).max(1000),
  budget: z.enum(["2500-4000", "4000-7000", "7000+", "a-definir"]),
  consent: z.literal("on"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Informations invalides" }, { status: 400 });

  const { prenom, email, telephone, objectif, budget } = parsed.data;
  await prisma.diagnosticLead.create({
    data: {
      email,
      telephone,
      reponses: { type: "VIP_APPLICATION", prenom, objectif, budget },
      utmSource: "coai-vip",
      utmMedium: "application",
    },
  });

  const whatsapp = buildWhatsAppLinkVersLead(telephone, email);
  await sendAdminNotification(
    `Candidature COAI Privé — ${prenom}`,
    [
      `Nouvelle candidature VIP de ${prenom}.`,
      `Email : ${email}`,
      `Téléphone : ${telephone}`,
      `Budget : ${budget}`,
      `Objectif : ${objectif}`,
      `WhatsApp : ${whatsapp}`,
    ].join("\n")
  ).catch((error) => console.error("[vip-application] notification :", error));

  return NextResponse.json({ ok: true }, { status: 201 });
}
