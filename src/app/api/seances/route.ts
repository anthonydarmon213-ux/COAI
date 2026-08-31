import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { trackServerEvent } from "@/lib/analytics/product-events";

const setSchema = z.object({
  set: z.number().int().positive(),
  reps: z.number().int().nonnegative(),
  charge: z.number().nonnegative(),
  rpe: z.number().min(1).max(10).optional(),
});

const bodySchema = z.object({
  date: z.coerce.date(),
  exercices: z.array(
    z.object({
      nom: z.string().min(1),
      series: z.number().int().positive().optional(),
      repetitions: z.number().int().positive().optional(),
      chargeKg: z.number().nonnegative().optional(),
      sets: z.array(setSchema).optional(),
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
  dureeMinutes: z.number().int().min(0).max(600).optional(),
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

  const seancesExistantes = await prisma.seanceLog.count({ where: { userId: user.id } });

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
      dureeMinutes: parsed.data.dureeMinutes,
    },
  });

  // Funnel (Phase 5B, 11/08/2026) : "first_workout_started" — COAI n'a pas
  // de suivi live d'une séance en cours, le log après-coup est le seul
  // signal disponible ; approximé par le tout premier SeanceLog du compte.
  if (seancesExistantes === 0) {
    trackServerEvent("first_workout_started", user.id);
  }
  trackServerEvent("workout_completed", user.id);
  if (parsed.data.difficulte != null || parsed.data.energie != null || parsed.data.douleur) {
    trackServerEvent("workout_checkin_completed", user.id);
  }

  return NextResponse.json(seance, { status: 201 });
}
