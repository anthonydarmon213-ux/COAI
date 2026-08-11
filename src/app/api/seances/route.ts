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
  // Check-in post-séance structuré (11/08/2026) — distinct de
  // ressenti/notes (texte libre existant), sert de signal au moteur
  // d'adaptation. Tout facultatif : le check-in reste utilisable même sans
  // les répondre toutes.
  difficulte: z.number().int().min(1).max(5).optional(),
  energie: z.number().int().min(1).max(5).optional(),
  douleur: z.enum(["AUCUNE", "LEGERE", "IMPORTANTE"]).optional(),
  douleurZone: z.string().max(200).optional(),
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
      difficulte: parsed.data.difficulte,
      energie: parsed.data.energie,
      douleur: parsed.data.douleur,
      douleurZone: parsed.data.douleur === "AUCUNE" ? undefined : parsed.data.douleurZone,
    },
  });

  return NextResponse.json(seance, { status: 201 });
}
