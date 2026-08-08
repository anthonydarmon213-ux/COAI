import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import type { ExerciceMaxi } from "@prisma/client";

// L'unité est déduite de l'exercice côté serveur (jamais confiée au
// client) : kg pour les mouvements de force, reps pour la traction au
// poids du corps, cm pour la souplesse, secondes pour l'équilibre, mètres
// pour l'endurance (test de Cooper, distance en 12 min).
const UNITE_PAR_EXERCICE: Record<ExerciceMaxi, string> = {
  DEVELOPPE_COUCHE: "kg",
  SQUAT: "kg",
  SOULEVE_DE_TERRE: "kg",
  TRACTION: "reps",
  SOUPLESSE: "cm",
  EQUILIBRE: "secondes",
  ENDURANCE: "m",
};

const bodySchema = z
  .object({
    exercice: z.enum([
      "DEVELOPPE_COUCHE",
      "SQUAT",
      "SOULEVE_DE_TERRE",
      "TRACTION",
      "SOUPLESSE",
      "EQUILIBRE",
      "ENDURANCE",
    ]),
    date: z.coerce.date(),
    // La souplesse (flexion antérieure) se mesure parfois en négatif — ne
    // pas atteindre ses pieds — les autres qualités n'ont pas de sens sous 0.
    valeur: z.number().min(-50).max(10000),
    notes: z.string().max(1000).optional(),
  })
  .refine((data) => data.exercice === "SOUPLESSE" || data.valeur > 0, {
    message: "La valeur doit être positive pour cet exercice",
    path: ["valeur"],
  });

export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const testsMaxi = await prisma.testMaxi.findMany({
    where: { user: { supabaseAuthId: authUser.id } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(testsMaxi);
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

  const testMaxi = await prisma.testMaxi.create({
    data: {
      userId: user.id,
      exercice: parsed.data.exercice,
      date: parsed.data.date,
      valeur: parsed.data.valeur,
      unite: UNITE_PAR_EXERCICE[parsed.data.exercice],
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json(testMaxi, { status: 201 });
}
