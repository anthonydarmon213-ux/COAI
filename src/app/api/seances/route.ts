import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { trackServerEvent } from "@/lib/analytics/product-events";

const setSchema = z.object({
  set: z.number().int().positive(),
  reps: z.number().int().nonnegative(),
  charge: z.number().nonnegative(),
  dureeSecondes: z.number().int().positive().max(3600).optional(),
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
  source: z.enum(["LIBRE", "REPCOUNT", "PROGRAMME"]).optional(),
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

  const source = parsed.data.source ?? "LIBRE";
  // Une nouvelle tentative après une coupure réseau réutilise exactement la
  // même date ISO. Si la première écriture avait réussi mais que sa réponse
  // s'était perdue, on renvoie la séance existante au lieu de créer un
  // doublon dans l'historique et les statistiques.
  const dejaEnregistree = await prisma.seanceLog.findFirst({
    where: { userId: user.id, date: parsed.data.date },
  });
  if (dejaEnregistree) {
    const nbDeCetteSource = await prisma.seanceLog.count({ where: { userId: user.id, source } });
    return NextResponse.json(dejaEnregistree, {
      status: 200,
      headers: {
        "X-COAI-First-Source": dejaEnregistree.source === source && nbDeCetteSource === 1 ? "1" : "0",
      },
    });
  }

  const entreesDeCetteSource = await prisma.seanceLog.count({ where: { userId: user.id, source } });

  const seance = await prisma.seanceLog.create({
    data: {
      userId: user.id,
      date: parsed.data.date,
      exercices: parsed.data.exercices,
      source,
      ressenti: parsed.data.ressenti,
      notes: parsed.data.notes,
      difficulte: parsed.data.difficulte,
      energie: parsed.data.energie,
      douleur: parsed.data.douleur,
      douleurZone: parsed.data.douleur === "AUCUNE" ? undefined : parsed.data.douleurZone,
      dureeMinutes: parsed.data.dureeMinutes,
    },
  });

  if (source === "PROGRAMME") {
    if (entreesDeCetteSource === 0) trackServerEvent("first_workout_completed", user.id);
    trackServerEvent("workout_completed", user.id);
    if (parsed.data.difficulte != null || parsed.data.energie != null || parsed.data.douleur) {
      trackServerEvent("workout_checkin_completed", user.id);
    }
  } else if (source === "REPCOUNT") {
    trackServerEvent("repcount_saved", user.id, { first: entreesDeCetteSource === 0 });
  }

  return NextResponse.json(seance, {
    status: 201,
    headers: { "X-COAI-First-Source": entreesDeCetteSource === 0 ? "1" : "0" },
  });
}
