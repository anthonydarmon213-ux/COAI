import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification } from "@/lib/email/client";
import { buildWhatsAppLinkVersLead } from "@/lib/email/lead-notification";

const schema = z.object({
  nom: z.string().trim().min(2).max(120), entreprise: z.string().trim().min(2).max(160),
  email: z.string().email().max(320), telephone: z.string().trim().min(8).max(30),
  effectif: z.string().max(40), priorite: z.string().max(120),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Informations invalides" }, { status: 400 });
  const data = parsed.data;
  await prisma.diagnosticLead.create({ data: { email: data.email, telephone: data.telephone, reponses: { type: "ENTERPRISE_LEAD", ...data }, utmSource: "coai-enterprise", utmMedium: "application" } });
  await sendAdminNotification(`Nouveau lead entreprise — ${data.entreprise}`, [`Contact : ${data.nom}`, `Entreprise : ${data.entreprise}`, `Effectif : ${data.effectif}`, `Priorité : ${data.priorite}`, `Email : ${data.email}`, `Téléphone : ${data.telephone}`, `WhatsApp : ${buildWhatsAppLinkVersLead(data.telephone, data.email)}`].join("\n")).catch((error) => console.error("[enterprise-lead] notification :", error));
  return NextResponse.json({ ok: true }, { status: 201 });
}
