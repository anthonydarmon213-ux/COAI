import { NextResponse } from "next/server";
import { z } from "zod";

const eventSchema = z.object({ type: z.string(), table: z.string(), schema: z.string() });

// Compatibility endpoint for an existing auth.users webhook. Authentication
// does not establish consent. Only the authenticated registration form may
// finalize the application account; retries recover via /completer-inscription.
// Never infer consent from editable raw_user_meta_data or an Auth INSERT.
export async function POST(request: Request) {
  const providedSecret = request.headers.get("x-webhook-secret");
  if (!process.env.SUPABASE_WEBHOOK_SECRET || providedSecret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Événement invalide" }, { status: 400 });
  const payload = parsed.data;

  if (payload.schema !== "auth" || payload.table !== "users" || payload.type !== "INSERT") {
    return NextResponse.json({ ignored: true });
  }

  return NextResponse.json({ received: true, registrationRequired: true });
}
