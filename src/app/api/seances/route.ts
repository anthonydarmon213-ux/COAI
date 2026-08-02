import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const bodySchema = z.object({
  date: z.coerce.date(),
  exercices: z.array(
    z.object({
      nom: z.string().min(1),
      series: z.number().int().positive().optional(),
      repetitions: z.number().int().positive().optional(),
      chargeKg: z.number().nonnegative().optional(),
    })
  ),
  ressenti: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const seances = await prisma.seanceLog.findMany({
    where: { user: { supabaseAuthId: authUser.id } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(seances);
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

  const seance = await prisma.seanceLog.create({
    data: {
      userId: user.id,
      date: parsed.data.date,
      exercices: parsed.data.exercices,
      ressenti: parsed.data.ressenti,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json(seance, { status: 201 });
}
