import { NextResponse } from "next/server";
import { accessibleTraining } from "@/lib/programmes/access";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { adaptWorkout, getSessionDuration, getWorkoutForDate } from "@/lib/daily/session";
import { Prisma } from "@prisma/client";

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

async function saveCheckin(userId: string, date: Date, data: Omit<Prisma.DailySessionUncheckedCreateInput, "userId" | "date">) {
  const where = { userId_date: { userId, date } };
  let daily;
  try {
    daily = await prisma.dailySession.upsert({
      where,
      create: { userId, date, ...data },
      update: {},
    });
  } catch (error) {
    // Two first check-ins may create the same day simultaneously.
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    daily = await prisma.dailySession.findUniqueOrThrow({ where });
  }
  // The condition is checked by the database, not by a stale pre-read:
  // a late check-in must never rewrite a completed workout's snapshot.
  const changed = await prisma.dailySession.updateMany({
    where: { id: daily.id, userId, completedAt: null },
    data,
  });
  if (!changed.count) {
    return NextResponse.json({ error: "Ta séance est déjà terminée. Son bilan est conservé." }, { status: 409 });
  }
  return NextResponse.json(await prisma.dailySession.findUniqueOrThrow({ where }));
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
  return accessibleTraining(validated, latest);
}

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("checkin"),
    sleep: z.enum(["TRES_MAUVAIS", "MAUVAIS", "CORRECT", "BON", "EXCELLENT"]),
    energy: z.enum(["TRES_BASSE", "BASSE", "NORMALE", "HAUTE", "TRES_HAUTE"]),
    // Charge mentale/agenda du jour (20/08/2026), facultative comme food —
    // aucun comportement ne change si absente.
    chargeMentale: z.enum(["LEGERE", "NORMALE", "CHARGEE", "SATUREE"]).optional(),
    food: z.enum(["PAS_ENCORE", "LEGER", "EQUILIBRE", "LOURD"]).optional(),
    pain: z.boolean(),
    painArea: z.string().trim().max(100).optional(),
    // Facultatif (19/08/2026) : requis en pratique pour un jour d'entraînement
    // (le formulaire complet l'envoie toujours, cf. DailyExperience), mais un
    // check-in léger les jours de repos (RestDayCheckin) n'a aucune séance à
    // dimensionner, donc rien à demander ici.
    availableMinutes: z.union([z.literal(15), z.literal(20), z.literal(25), z.literal(40), z.literal(60), z.literal(75)]).optional(),
    // Matériel réellement dispo ce jour-là (22/08/2026, demande Anthony :
    // "ça peut évoluer") — facultatif : sans réponse, la séance continue
    // d'utiliser l'équipement du profil, exactement comme avant.
    equipementDuJour: z.string().trim().max(300).optional(),
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Données du check-in illisibles. Réessaie l’enregistrement." },
      { status: 400 }
    );
  }
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const date = today();
  if (parsed.data.action === "checkin") {
    const programme = await activeTrainingProgramme(user.id);
    if (!programme) return NextResponse.json({ error: "Aucun programme disponible" }, { status: 409 });
    const source = getWorkoutForDate(programme.contenu, date);

    // Jour de repos (19/08/2026, retour Anthony : le Score COAI restait
    // bloqué les jours sans séance faute de pouvoir check-in) : check-in
    // léger sommeil/énergie/douleur, sans séance à adapter — les champs
    // sourceSession/adaptedSession/adaptation restent vides plutôt que
    // d'inventer une séance qui n'existe pas ce jour-là.
    const checkinCommun = {
      sleep: parsed.data.sleep,
      energy: parsed.data.energy,
      chargeMentale: parsed.data.chargeMentale,
      pain: parsed.data.pain,
      painArea: parsed.data.pain ? parsed.data.painArea : null,
      availableMinutes: parsed.data.availableMinutes,
      equipementDuJour: parsed.data.equipementDuJour,
    };

    if (!source) {
      return saveCheckin(user.id, date, {
        ...checkinCommun,
        programmeSourceId: programme.id,
        programmeVersion: programme.version,
        sourceSession: Prisma.DbNull,
        adaptedSession: Prisma.DbNull,
        adaptation: Prisma.DbNull,
        availableMinutes: null,
        equipementDuJour: null,
      });
    }

    const expectedMinutes = getSessionDuration(source, user.profile?.dureeSeanceMinutes ?? 45);
    if (parsed.data.availableMinutes === undefined) {
      return NextResponse.json({ error: "Temps disponible requis pour un jour d'entraînement" }, { status: 400 });
    }
    const { session, summary } = adaptWorkout(
      source,
      { ...parsed.data, availableMinutes: parsed.data.availableMinutes },
      expectedMinutes
    );
    const seanceCommune = {
      programmeSourceId: programme.id,
      programmeVersion: programme.version,
      sourceSession: asJson(source),
      adaptedSession: asJson(session),
      adaptation: asJson(summary),
      ...checkinCommun,
    };
    return saveCheckin(user.id, date, seanceCommune);
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
