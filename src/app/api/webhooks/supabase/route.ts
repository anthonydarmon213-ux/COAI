import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

type SupabaseAuthWebhookPayload = {
  type: string;
  table: string;
  record: {
    id: string;
    email: string;
    raw_user_meta_data?: Record<string, unknown>;
  };
};

// Chemin alternatif à /api/compte/register : si un Database Webhook Supabase
// est configuré sur auth.users (INSERT), il crée ici l'enregistrement User
// applicatif. Utile en filet de sécurité si le client n'a pas pu appeler
// /api/compte/register (ex: coupure réseau juste après l'inscription).
export async function POST(request: Request) {
  const providedSecret = request.headers.get("x-webhook-secret");
  if (!process.env.SUPABASE_WEBHOOK_SECRET || providedSecret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const payload = (await request.json()) as SupabaseAuthWebhookPayload;

  if (payload.table !== "users" || payload.type !== "INSERT") {
    return NextResponse.json({ ignored: true });
  }

  await prisma.user.upsert({
    where: { supabaseAuthId: payload.record.id },
    update: {},
    create: {
      supabaseAuthId: payload.record.id,
      email: payload.record.email,
      consentRgpdAt: new Date(),
    },
  });

  return NextResponse.json({ received: true });
}
