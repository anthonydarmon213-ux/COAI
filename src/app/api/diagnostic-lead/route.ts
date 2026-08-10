import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification, sendEmail } from "@/lib/email/client";
import { buildMiniDiagnostic, miniDiagnosticEnTexte, type ReponsesDiagnostic } from "@/lib/diagnostic/mini-diagnostic";

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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.fr";
  const diagnostic = buildMiniDiagnostic(parsed.data.reponses as ReponsesDiagnostic);

  // Envoie aussi le diagnostic à la personne elle-même — jusqu'ici seule
  // Anthony était notifié, malgré la case cochée "j'accepte de recevoir mon
  // diagnostic par email" à l'étape précédente du quiz : la promesse n'était
  // jamais tenue (repéré le 11/08 via le test d'un ami d'Anthony qui n'a
  // rien reçu). Best-effort comme le reste, ne doit jamais faire échouer la
  // capture ni bloquer l'affichage du résultat côté client.
  await Promise.all([
    sendAdminNotification(
      "Nouveau lead — diagnostic COAI",
      `${parsed.data.email} vient de terminer le diagnostic gratuit sur coai.fr.`
    ),
    diagnostic
      ? sendEmail(
          parsed.data.email,
          "Ton diagnostic COAI",
          miniDiagnosticEnTexte(diagnostic, appUrl)
        )
      : Promise.resolve(),
  ]);

  return NextResponse.json(lead, { status: 201 });
}
