import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const PERIOD_DAYS = 56;
const RECENT_LIMIT = 6;

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie, Authorization",
  "X-Content-Type-Options": "nosniff",
};

type CountByDate = { date: Date; _count: { _all: number } };

function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers });
}

function dateISO(value: Date) {
  return value.toISOString();
}

function sourceTitle(source: string) {
  switch (source) {
    case "REPCOUNT": return "Séance RepCount";
    case "PROGRAMME": return "Séance du programme";
    default: return "Séance libre";
  }
}

function dailyTitle(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "Séance quotidienne";
  const name = (value as Record<string, unknown>).nom;
  if (typeof name !== "string") return "Séance quotidienne";
  const normalized = name.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return normalized.length > 0 && normalized.length <= 120 ? normalized : "Séance quotidienne";
}

function weeksFrom(now: Date, logs: CountByDate[], dailies: CountByDate[]) {
  const from = new Date(now.getTime() - PERIOD_DAYS * DAY_MS);
  const counts = Array.from({ length: PERIOD_DAYS / 7 }, () => 0);

  for (const item of [...logs, ...dailies]) {
    const week = Math.floor((item.date.getTime() - from.getTime()) / WEEK_MS);
    if (week >= 0 && week < counts.length) counts[week] = (counts[week] ?? 0) + item._count._all;
  }

  return counts.map((count, index) => ({
    startDate: dateISO(new Date(from.getTime() + index * WEEK_MS)),
    count,
  }));
}

export async function GET() {
  try {
    const user = await getCurrentAppUser();
    if (!user) return privateJson({ error: "Connecte-toi pour voir ta progression." }, 401);

    const now = new Date();
    const from = new Date(now.getTime() - PERIOD_DAYS * DAY_MS);
    const date = { gte: from, lt: now };

    // Aggregate exact counts in the database; retrieve only the six newest
    // entries for the timeline. No notes, pain, energy, loads, or user IDs are
    // returned to the iOS client.
    const [logCounts, dailyCounts, logs, dailies] = await Promise.all([
      prisma.seanceLog.groupBy({
        by: ["date"], where: { userId: user.id, date }, _count: { _all: true },
      }),
      prisma.dailySession.groupBy({
        by: ["date"], where: { userId: user.id, date, completedAt: { not: null } }, _count: { _all: true },
      }),
      prisma.seanceLog.findMany({
        where: { userId: user.id, date },
        select: { date: true, createdAt: true, source: true },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: RECENT_LIMIT,
      }),
      prisma.dailySession.findMany({
        where: { userId: user.id, date, completedAt: { not: null } },
        select: { date: true, completedAt: true, adaptedSession: true },
        orderBy: [{ date: "desc" }, { completedAt: "desc" }],
        take: RECENT_LIMIT,
      }),
    ]);

    const weeks = weeksFrom(now, logCounts, dailyCounts);
    const totalSessions = weeks.reduce((total, week) => total + week.count, 0);
    const last28Days = weeks.slice(-4).reduce((total, week) => total + week.count, 0);
    const recent = [
      ...logs.map((entry) => ({
        date: entry.date,
        sortDate: entry.createdAt,
        title: sourceTitle(entry.source),
        source: entry.source,
      })),
      ...dailies.flatMap((entry) => entry.completedAt ? [{
        date: entry.date,
        sortDate: entry.completedAt,
        title: dailyTitle(entry.adaptedSession),
        source: "DAILY" as const,
      }] : []),
    ]
      .sort((a, b) => b.date.getTime() - a.date.getTime() || b.sortDate.getTime() - a.sortDate.getTime())
      .slice(0, RECENT_LIMIT)
      .map((entry, id) => ({ id, date: dateISO(entry.date), title: entry.title, source: entry.source }));

    return privateJson({
      periodDays: PERIOD_DAYS,
      totalSessions,
      last28Days,
      weeks,
      recent,
    });
  } catch (error) {
    console.error("[ios-progress] Could not load workout progress", error instanceof Error ? error.name : "UnknownError");
    return privateJson({ error: "Ta progression est momentanément indisponible. Réessaie." }, 503);
  }
}
