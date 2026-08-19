import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { trackServerEvent } from "@/lib/analytics/product-events";
import { buildEtatRecuperationMuscles } from "@/lib/insight/recuperation-musculaire";

const GROUPES = ["DOS", "PECTORAUX", "EPAULES", "BRAS", "JAMBES", "FESSIERS", "ABDOMINAUX", "MOLLETS"] as const;
const NIVEAUX = ["COURBATURES_FORTES", "COURBATURES_LEGERES", "LEGERE_FATIGUE", "FRAIS"] as const;

const bodySchema = z.object({
  groupe: z.enum(GROUPES),
  niveau: z.enum(NIVEAUX),
});

function aujourdhui() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// GET renvoie les 30 derniers jours d'entrées — assez large pour calculer
// "dernier état connu" par groupe même si l'utilisateur ne s'est pas
// connecté récemment, sans remonter indéfiniment (cf. buildEtatRecuperationMuscles).
export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const entrees = await prisma.recuperationMusculaire.findMany({
    where: { userId: user.id, date: { gte: new Date(aujourdhui().getTime() - 30 * 24 * 60 * 60 * 1000) } },
    select: { groupe: true, niveau: true, date: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json({ etat: buildEtatRecuperationMuscles(entrees) });
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

  const date = aujourdhui();
  const entree = await prisma.recuperationMusculaire.upsert({
    where: { userId_groupe_date: { userId: user.id, groupe: parsed.data.groupe, date } },
    create: { userId: user.id, groupe: parsed.data.groupe, niveau: parsed.data.niveau, date },
    update: { niveau: parsed.data.niveau },
  });

  trackServerEvent("muscle_recovery_logged", user.id);

  return NextResponse.json(entree, { status: 201 });
}
