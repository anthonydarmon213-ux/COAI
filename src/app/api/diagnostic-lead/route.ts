import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification } from "@/lib/email/client";

const bodySchema = z.object({
  email: z.string().email().max(320),
  reponses: z.record(z.unknown()),
});

// Capture le lead sur /diagnostic (quiz public, visiteur anonyme) juste
// avant de révéler l'aperçu personnalisé — pas d'authentification requise
// par nature (personne n'a encore de compte à ce stade). Best-effort côté
// appelant : ne doit jamais bloquer l'affichage du résultat si ça échoue.
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const lead = await prisma.diagnosticLead.create({
    data: { email: parsed.data.email, reponses: parsed.data.reponses as Prisma.InputJsonValue },
  });

  // Notifie Anthony à chaque lead capturé sur le diagnostic public — ce
  // trou existait depuis la création du quiz (09/08/2026), jusqu'ici
  // invisible sans requête SQL manuelle (repéré le 10/08 via un test d'un
  // ami d'Anthony). Best-effort, ne doit jamais faire échouer la capture.
  await sendAdminNotification(
    "Nouveau lead — diagnostic COAI",
    `${parsed.data.email} vient de terminer le diagnostic gratuit sur coai.fr.`
  );

  return NextResponse.json(lead, { status: 201 });
}
