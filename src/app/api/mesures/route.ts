import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { mesureBodySchema, mesureValidationErrors } from "@/lib/suivi/mesure-validation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { isOwnedProgressPhotoPath } from "@/lib/storage/progress-photos";

export async function GET() {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie, Authorization" };
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401, headers });
  }

  const mesures = await prisma.mesure.findMany({
    where: { user: { supabaseAuthId: authUser.id } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(mesures, { headers });
}

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = mesureBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const validation = mesureValidationErrors(parsed.error);
    return NextResponse.json({ error: validation.message, fieldErrors: validation.fields }, { status: 400 });
  }

  const retryKey = request.headers.get("x-coai-request-id");
  if (retryKey !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(retryKey)) {
    return NextResponse.json({ error: "Référence d’enregistrement invalide." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  if (parsed.data.photoPath && !isOwnedProgressPhotoPath(authUser.id, parsed.data.photoPath)) {
    return NextResponse.json({ error: "Chemin de photo invalide" }, { status: 400 });
  }

  const id = retryKey ? `retry_${createHash("sha256").update(JSON.stringify([user.id, retryKey.toLowerCase()])).digest("hex")}` : undefined;
  const data = {
      ...(id ? { id } : {}),
      userId: user.id,
      date: parsed.data.date,
      poidsKg: parsed.data.poidsKg,
      tourTailleCm: parsed.data.tourTailleCm,
      masseGrassePourcent: parsed.data.masseGrassePourcent,
      masseMusculaireKg: parsed.data.masseMusculaireKg,
      frequenceCardiaqueReposBpm: parsed.data.frequenceCardiaqueReposBpm,
      notes: parsed.data.notes,
      photoPath: parsed.data.photoPath,
    };
  try {
    const mesure = await prisma.mesure.create({ data });
    return NextResponse.json(mesure, { status: 201 });
  } catch (error) {
    // The primary key makes concurrent retries atomic, without a schema change.
    if (id && typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      const existing = await prisma.mesure.findUnique({ where: { id } }).catch(() => null);
      if (existing?.userId === user.id) {
        const fields = ["poidsKg", "tourTailleCm", "masseGrassePourcent", "masseMusculaireKg", "frequenceCardiaqueReposBpm", "notes", "photoPath"] as const;
        if (existing.date.getTime() === data.date.getTime() && fields.every(field => (existing[field] ?? null) === (data[field] ?? null))) {
          return NextResponse.json(existing, { status: 200 });
        }
        return NextResponse.json({ error: "Cette tentative a déjà enregistré une mesure différente. Recharge ton historique avant de recommencer." }, { status: 409 });
      }
    }
    return NextResponse.json({ error: "L’enregistrement n’a pas pu être confirmé. Réessaie dans un instant." }, { status: 503 });
  }
}
