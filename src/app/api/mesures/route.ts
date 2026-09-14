import { NextResponse } from "next/server";
import { mesureBodySchema, mesureValidationErrors } from "@/lib/suivi/mesure-validation";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { isOwnedProgressPhotoPath } from "@/lib/storage/progress-photos";

export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const mesures = await prisma.mesure.findMany({
    where: { user: { supabaseAuthId: authUser.id } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(mesures);
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

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  if (parsed.data.photoPath && !isOwnedProgressPhotoPath(authUser.id, parsed.data.photoPath)) {
    return NextResponse.json({ error: "Chemin de photo invalide" }, { status: 400 });
  }

  const mesure = await prisma.mesure.create({
    data: {
      userId: user.id,
      date: parsed.data.date,
      poidsKg: parsed.data.poidsKg,
      tourTailleCm: parsed.data.tourTailleCm,
      masseGrassePourcent: parsed.data.masseGrassePourcent,
      masseMusculaireKg: parsed.data.masseMusculaireKg,
      frequenceCardiaqueReposBpm: parsed.data.frequenceCardiaqueReposBpm,
      notes: parsed.data.notes,
      photoPath: parsed.data.photoPath,
    },
  });

  return NextResponse.json(mesure, { status: 201 });
}
