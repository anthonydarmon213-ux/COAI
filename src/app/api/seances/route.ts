import { NextResponse } from "next/server";
import { workoutHistory } from "@/lib/suivi/workout-history";
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
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie, Authorization" };
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401, headers });
  }

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id }, select: { id: true } });
  const seances = user ? await workoutHistory(user.id) : [];

  return NextResponse.json(seances, { headers });
}

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Données de séance illisibles. Réessaie l’enregistrement." },
      { status: 400 }
    );
  }
  const parsed = bodySchema.safeParse(body);
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
  const { seance, created, first } = await prisma.$transaction(async tx => {
    // Sérialise seulement les écritures de ce membre. Aucun appel externe
    // dans cette courte transaction ; le verrou est libéré au commit/rollback.
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${user.id} FOR UPDATE`;
    const dejaEnregistree = await tx.seanceLog.findFirst({
      where: { userId: user.id, date: parsed.data.date },
    });
    const entreesDeCetteSource = await tx.seanceLog.count({ where: { userId: user.id, source } });
    if (dejaEnregistree) return {
      seance: dejaEnregistree, created: false,
      first: dejaEnregistree.source === source && entreesDeCetteSource === 1,
    };
    const seance = await tx.seanceLog.create({
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
    return { seance, created: true, first: entreesDeCetteSource === 0 };
  });

  if (created && source === "PROGRAMME") {
    if (first) trackServerEvent("first_workout_completed", user.id);
    trackServerEvent("workout_completed", user.id);
    if (parsed.data.difficulte != null || parsed.data.energie != null || parsed.data.douleur) {
      trackServerEvent("workout_checkin_completed", user.id);
    }
  } else if (created && source === "REPCOUNT") {
    trackServerEvent("repcount_saved", user.id, { first });
  }

  return NextResponse.json(seance, {
    status: created ? 201 : 200,
    headers: { "X-COAI-First-Source": first ? "1" : "0" },
  });
}
