import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

// Désabonnement à la séquence de nurture post-diagnostic (16/08/2026) — lien
// présent dans chaque email de la séquence, vérifié par jeton HMAC (pas
// d'authentification requise, cf. src/lib/email/unsubscribe.ts). Marque
// toutes les lignes de cette adresse pour bloquer tout futur envoi, jamais
// l'email de résultat lui-même (transactionnel, déjà envoyé).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  const token = url.searchParams.get("token");

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: "Lien invalide." }, { status: 400 });
  }

  await prisma.diagnosticLead.updateMany({
    where: { email: { equals: email, mode: "insensitive" } },
    data: { optedOutAt: new Date() },
  });

  return new NextResponse(
    "<!doctype html><html><head><meta charset=\"utf-8\"><title>Désabonnement COAI</title></head>" +
      "<body style=\"font-family:sans-serif;max-width:32rem;margin:4rem auto;text-align:center;color:#171817\">" +
      "<h1>Tu ne recevras plus d'emails de suivi COAI.</h1>" +
      "<p>Cette désinscription ne concerne que les emails de suivi après ton diagnostic — pas les emails liés à un compte COAI actif.</p>" +
      "</body></html>",
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
