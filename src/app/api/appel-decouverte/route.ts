import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification } from "@/lib/email/client";
import { buildWhatsAppLinkVersLead } from "@/lib/email/lead-notification";

// Route creee le 04/09/2026 (demande Anthony : « fais le formulaire ou le
// WhatsApp »), sur le modele de charlesdenis.fr, dont tous les boutons
// aboutissent a une candidature telephone + prenom + nom avant tout prix.
//
// Volontairement distincte de /api/vip-application : celle-ci exige une
// fourchette de budget, ce qui a du sens pour une candidature VIP mais
// ferait fuir un prospect froid a qui l'on n'a encore montre aucun tarif.
// Ici on demande le strict necessaire pour rappeler quelqu'un.
const schema = z.object({
  prenom: z.string().trim().min(2).max(80),
  nom: z.string().trim().min(1).max(80),
  telephone: z.string().trim().min(8).max(30),
  email: z.string().email().max(320),
  objectif: z.string().trim().min(10).max(1000),
  disponibilite: z.enum(["matin", "midi", "soir", "peu-importe"]),
  consent: z.literal("on"),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Informations invalides" }, { status: 400 });
  }

  const { prenom, nom, telephone, email, objectif, disponibilite } = parsed.data;

  await prisma.diagnosticLead.create({
    data: {
      email,
      telephone,
      reponses: { type: "APPEL_DECOUVERTE", prenom, nom, objectif, disponibilite },
      utmSource: "coai-site",
      utmMedium: "appel-decouverte",
    },
  });

  const whatsapp = buildWhatsAppLinkVersLead(telephone, email);
  await sendAdminNotification(
    `Appel découverte demandé — ${prenom} ${nom}`,
    [
      `${prenom} ${nom} demande un appel découverte.`,
      `Téléphone : ${telephone}`,
      `Email : ${email}`,
      `Disponibilité : ${disponibilite}`,
      `Objectif : ${objectif}`,
      `WhatsApp : ${whatsapp}`,
    ].join("\n")
  ).catch((error) => console.error("[appel-decouverte] notification :", error));

  return NextResponse.json({ ok: true }, { status: 201 });
}
