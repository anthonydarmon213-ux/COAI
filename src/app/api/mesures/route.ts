import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const bodySchema = z.object({
  date: z.coerce.date(),
  poidsKg: z.number().positive().max(500).optional(),
  tourTailleCm: z.number().positive().max(300).optional(),
  masseGrassePourcent: z.number().min(0).max(100).optional(),
  masseMusculaireKg: z.number().positive().max(200).optional(),
  frequenceCardiaqueReposBpm: z.number().int().min(20).max(220).optional(),
  notes: z.string().max(2000).optional(),
  photoPath: z.string().max(500).optional(),
});

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

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
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
