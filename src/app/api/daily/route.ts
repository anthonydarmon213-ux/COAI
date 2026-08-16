import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { adaptWorkout, getSessionDuration, getWorkoutForDate } from "@/lib/daily/session";
import type { Prisma } from "@prisma/client";

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

async function currentAppUser() {
  const auth = await getCurrentUser();
  if (!auth) return null;
  return prisma.user.findUnique({ where: { supabaseAuthId: auth.id }, include: { profile: true } });
}

async function activeTrainingProgramme(userId: string) {
  const [validated, latest] = await Promise.all([
    prisma.programmeGenerated.findFirst({
      where: { userId, pilier: "ENTRAINEMENT", statut: "VALIDE" },
      orderBy: { generatedAt: "desc" },
    }),
    prisma.programmeGenerated.findFirst({
      where: { userId, pilier: "ENTRAINEMENT" },
      orderBy: { generatedAt: "desc" },
    }),
  ]);
  return validated ?? latest;
}

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("checkin"),
    sleep: z.enum(["TRES_MAUVAIS", "MAUVAIS", "CORRECT", "BON", "EXCELLENT"]),
    energy: z.enum(["TRES_BASSE", "BASSE", "NORMALE", "HAUTE", "TRES_HAUTE"]),
    food: z.enum(["PAS_ENCORE", "LEGER", "EQUILIBRE", "LOURD"]),
    pain: z.boolean(),
    painArea: z.string().trim().max(100).optional(),
    availableMinutes: z.union([z.literal(15), z.literal(25), z.literal(40), z.literal(60), z.literal(75)]),
  }),
  z.object({ action: z.literal("complete") }),
  z.object({
    action: z.literal("feedback"),
    workoutRating: z.enum(["TROP_FACILE", "BIEN_DOSEE", "TROP_DURE"]),
    feedbackPain: z.boolean(),
    feedbackComment: z.string().trim().max(1000).optional(),
  }),
]);

export async function GET() {
  const user = await currentAppUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const daily = await prisma.dailySession.findUnique({
    where: { userId_date: { userId: user.id, date: today() } },
  });
  return NextResponse.json(daily);
}

export async function POST(request: Request) {
  const user = await currentAppUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const date = today();
  if (parsed.data.action === "checkin") {
    const programme = await activeTrainingProgramme(user.id);
    if (!programme) return NextResponse.json({ error: "Aucun programme disponible" }, { status: 409 });
    const source = getWorkoutForDate(programme.contenu, date);
    if (!source) return NextResponse.json({ error: "Aujourd'hui est un jour de repos" }, { status: 409 });

    const expectedMinutes = getSessionDuration(source, user.profile?.dureeSeanceMinutes ?? 45);
    const { session, summary } = adaptWorkout(source, parsed.data, expectedMinutes);
    const daily = await prisma.dailySession.upsert({
      where: { userId_date: { userId: user.id, date } },
      create: {
        userId: user.id,
        date,
        programmeSourceId: programme.id,
        programmeVersion: programme.version,
        sourceSession: asJson(source),
        adaptedSession: asJson(session),
        adaptation: asJson(summary),
        sleep: parsed.data.sleep,
        energy: parsed.data.energy,
        pain: parsed.data.pain,
        painArea: parsed.data.pain ? parsed.data.painArea : null,
        availableMinutes: parsed.data.availableMinutes,
      },
      update: {
        programmeSourceId: programme.id,
        programmeVersion: programme.version,
        sourceSession: asJson(source),
        adaptedSession: asJson(session),
        adaptation: asJson(summary),
        sleep: parsed.data.sleep,
        energy: parsed.data.energy,
        pain: parsed.data.pain,
        painArea: parsed.data.pain ? parsed.data.painArea : null,
        availableMinutes: parsed.data.availableMinutes,
      },
    });
    return NextResponse.json(daily);
  }

  const existing = await prisma.dailySession.findUnique({
    where: { userId_date: { userId: user.id, date } },
  });
  if (!existing) return NextResponse.json({ error: "Check-in quotidien introuvable" }, { status: 404 });

  if (parsed.data.action === "complete") {
    const daily = await prisma.dailySession.update({
      where: { id: existing.id },
      data: { completedAt: existing.completedAt ?? new Date() },
    });
    return NextResponse.json(daily);
  }

  const daily = await prisma.dailySession.update({
    where: { id: existing.id },
    data: {
      workoutRating: parsed.data.workoutRating,
      feedbackPain: parsed.data.feedbackPain,
      feedbackComment: parsed.data.feedbackComment || null,
      completedAt: existing.completedAt ?? new Date(),
    },
  });
  return NextResponse.json(daily);
}
