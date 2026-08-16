import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { lundiDeSemaine } from "@/lib/checkin/semaine";
import { trackServerEvent } from "@/lib/analytics/product-events";

const bodySchema = z.object({
  sommeil: z.enum(["TRES_MAUVAIS", "MAUVAIS", "CORRECT", "BON", "EXCELLENT"]).optional(),
  energie: z.number().int().min(1).max(5).optional(),
  stress: z.number().int().min(1).max(5).optional(),
  faim: z.number().int().min(1).max(5).optional(),
  motivation: z.number().int().min(1).max(5).optional(),
  poidsKg: z.number().positive().optional(),
  douleurs: z.boolean().optional(),
  seancesRealisees: z.number().int().min(0).max(14).optional(),
  repasMaison: z.number().int().min(0).max(21).optional(),
  repasRestaurant: z.number().int().min(0).max(21).optional(),
  commentaire: z.string().max(1000).optional(),
});

// Le check-in hebdomadaire est dû dès qu'aucune entrée n'existe pour la
// semaine en cours (lundi courant) — pas de rappel/notification pour
// l'instant, la carte du dashboard se contente de s'afficher tant que ce
// n'est pas fait (cf. WeeklyCheckinCard).
export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const semaineDebut = lundiDeSemaine(new Date());
  const [checkinSemaine, dernier] = await Promise.all([
    prisma.weeklyCheckin.findUnique({
      where: { userId_semaineDebut: { userId: user.id, semaineDebut } },
    }),
    prisma.weeklyCheckin.findFirst({
      where: { userId: user.id },
      orderBy: { semaineDebut: "desc" },
    }),
  ]);

  return NextResponse.json({
    du: !checkinSemaine,
    semaineDebut: semaineDebut.toISOString(),
    dernier,
  });
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

  const semaineDebut = lundiDeSemaine(new Date());

  const contexteRepas = [
    parsed.data.repasMaison != null ? `Repas maison : ${parsed.data.repasMaison}` : null,
    parsed.data.repasRestaurant != null ? `Repas restaurant/extérieur : ${parsed.data.repasRestaurant}` : null,
  ].filter(Boolean).join(" · ");
  const commentaire = [contexteRepas, parsed.data.commentaire].filter(Boolean).join(" — ") || undefined;
  const { repasMaison: _repasMaison, repasRestaurant: _repasRestaurant, ...checkinData } = parsed.data;

  const checkin = await prisma.weeklyCheckin.upsert({
    where: { userId_semaineDebut: { userId: user.id, semaineDebut } },
    create: { userId: user.id, semaineDebut, ...checkinData, commentaire },
    update: { ...checkinData, commentaire },
  });

  trackServerEvent("weekly_checkin_completed", user.id);

  return NextResponse.json(checkin, { status: 201 });
}
