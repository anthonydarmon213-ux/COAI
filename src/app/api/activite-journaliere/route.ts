import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { collecterSignaux } from "@/lib/adaptation/signals";
import { collecterSignauxNeat } from "@/lib/neat/signaux";
import { calculerRecommandationNeat } from "@/lib/neat/recommandation";
import { getEtatVoyage } from "@/lib/neat/voyage";
import { trackServerEvent } from "@/lib/analytics/product-events";

const bodySchema = z.object({
  pas: z.number().int().min(0).max(100000).optional(),
  source: z.enum(["SAISIE_MANUELLE", "MONTRE", "APPLICATION_SANTE"]).default("SAISIE_MANUELLE"),
  typeJournee: z.enum(["TRAVAIL", "REPOS", "VOYAGE", "WEEKEND"]).optional(),
  typeTravail: z.enum(["ASSIS", "MIXTE", "DEBOUT", "PHYSIQUE"]).optional(),
});

function aujourdhui(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function construireResume(userId: string) {
  const [signauxNeat, signauxAdaptation, etatVoyage, derniereAdaptation] = await Promise.all([
    collecterSignauxNeat(userId),
    collecterSignaux(userId, "ENTRAINEMENT"),
    getEtatVoyage(userId),
    prisma.programmeAdaptation.findFirst({
      where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const contrainteRecenteType =
    derniereAdaptation?.contexte && typeof derniereAdaptation.contexte === "object"
      ? ((derniereAdaptation.contexte as Record<string, unknown>).type as string | undefined) ?? null
      : null;

  const recommandation = calculerRecommandationNeat(
    signauxNeat,
    signauxAdaptation,
    etatVoyage,
    contrainteRecenteType
  );

  return { signaux: signauxNeat, recommandation, enVoyage: etatVoyage.actif };
}

// GET : entrée du jour (s'il y en a une) + résumé (moyennes, tendance,
// recommandation) pour la carte "Activité quotidienne" du dashboard.
export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const [entreeAujourdhui, resume] = await Promise.all([
    prisma.activiteJournaliere.findUnique({
      where: { userId_date: { userId: user.id, date: aujourdhui() } },
    }),
    construireResume(user.id),
  ]);

  if (resume.recommandation.type !== "INSUFFISANT") {
    trackServerEvent("neat_recommendation_shown", user.id, { type: resume.recommandation.type });
  }

  return NextResponse.json({ entreeAujourdhui, ...resume });
}

// POST : saisit (ou corrige) l'entrée du jour — jamais les jours passés,
// jamais d'écrasement d'un autre jour (upsert borné à la date du jour côté
// serveur, pas confiée au client).
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

  const premiereSaisie = (await prisma.activiteJournaliere.count({ where: { userId: user.id } })) === 0;
  const date = aujourdhui();

  const entree = await prisma.activiteJournaliere.upsert({
    where: { userId_date: { userId: user.id, date } },
    create: { userId: user.id, date, ...parsed.data },
    update: parsed.data,
  });

  trackServerEvent("neat_log_recorded", user.id, { source: parsed.data.source });
  if (premiereSaisie) trackServerEvent("neat_first_log", user.id);

  const resume = await construireResume(user.id);

  return NextResponse.json({ entreeAujourdhui: entree, ...resume }, { status: 201 });
}
