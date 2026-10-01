import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron/auth";
import { purgeRetiredAvatarBatch } from "@/lib/storage/progress-photos";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store" };

// Prepared, not scheduled in vercel.json. Activation requires migration,
// deployment approval and a check of the existing hosting usage allowance.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401, headers });
  }
  if (process.env.PHOTO_RETIREMENT_CRON_ENABLED !== "true") {
    return NextResponse.json({ error: "Nettoyage automatique non activé" }, { status: 503, headers });
  }
  try {
    const result = await purgeRetiredAvatarBatch();
    return NextResponse.json(result, { status: result.deferred ? 503 : 200, headers });
  } catch {
    return NextResponse.json({ error: "Nettoyage à réessayer" }, { status: 503, headers });
  }
}
