import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

// Routines : modèles de séance réutilisables. Lecture et création.
// Volontairement sans verrou d'abonnement : c'est le confort de base du
// carnet, et ce qui fait revenir l'utilisateur. Aucun appel IA ici, donc
// aucun coût par usage à couvrir.

const schema = z.object({
  nom: z.string().trim().min(1, "Nom requis").max(60),
  exercices: z
    .array(
      z.object({
        nom: z.string().trim().min(1).max(80),
        series: z.number().int().min(1).max(20).optional(),
      })
    )
    .min(1, "Au moins un exercice")
    .max(30),
});

async function utilisateur() {
  const authUser = await getCurrentUser();
  if (!authUser) return null;
  return prisma.user.findUnique({ where: { supabaseAuthId: authUser.id }, select: { id: true } });
}

export async function GET() {
  const user = await utilisateur();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const routines = await prisma.routine.findMany({
    where: { userId: user.id },
    orderBy: { nom: "asc" },
  });
  return NextResponse.json(routines);
}

export async function POST(request: Request) {
  const user = await utilisateur();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Garde-fou volumétrique : une routine est un modèle, pas un historique.
  // Au-delà de 40, c'est un usage détourné et la liste devient illisible.
  const existantes = await prisma.routine.count({ where: { userId: user.id } });
  if (existantes >= 40) {
    return NextResponse.json(
      { error: "Limite de 40 routines atteinte. Supprime-en une avant d'en créer une nouvelle." },
      { status: 409 }
    );
  }

  const routine = await prisma.routine.create({
    data: { userId: user.id, nom: parsed.data.nom, exercices: parsed.data.exercices },
  });
  return NextResponse.json(routine, { status: 201 });
}
