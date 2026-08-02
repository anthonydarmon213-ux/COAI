import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const bodySchema = z.object({
  date: z.coerce.date(),
  poidsKg: z.number().positive().max(500).optional(),
  tourTailleCm: z.number().positive().max(300).optional(),
  notes: z.string().max(2000).optional(),
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
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json(mesure, { status: 201 });
}
