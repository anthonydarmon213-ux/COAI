import "server-only";
import { prisma } from "@/lib/db/client";
import type { DailySession, SeanceLog } from "@prisma/client";

export type WorkoutHistoryEntry = SeanceLog & {
  dailySessionId?: string;
  dailyTitle?: string;
  dailyRating?: string | null;
  dailyPain?: boolean | null;
};

type HistoryOptions = { from?: Date; before?: Date; take?: number; order?: "asc" | "desc" };
type DailyHistorySource = Pick<DailySession, "id" | "userId" | "date" | "completedAt" | "adaptedSession" | "feedbackComment" | "workoutRating" | "feedbackPain">;

// A completed plan is not proof that its prescribed sets, loads or duration
// were performed. Keep those metrics unknown, not zero or copied from the plan.
export function dailyHistoryEntry(daily: DailyHistorySource): WorkoutHistoryEntry | null {
  if (!daily.completedAt) return null;
  const session = daily.adaptedSession;
  const title = session && typeof session === "object" && !Array.isArray(session)
    && typeof session.nom === "string" ? session.nom : "Séance quotidienne";
  return {
    id: `daily:${daily.id}`, userId: daily.userId, date: daily.date,
    createdAt: daily.completedAt, source: "PROGRAMME", exercices: [],
    ressenti: null, notes: daily.feedbackComment, difficulte: null,
    energie: null, douleur: null, douleurZone: null, dureeMinutes: null,
    dailySessionId: daily.id, dailyTitle: title,
    dailyRating: daily.workoutRating, dailyPain: daily.feedbackPain,
  };
}

export async function workoutHistory(userId: string, options: HistoryOptions = {}): Promise<WorkoutHistoryEntry[]> {
  const date = { gte: options.from, lt: options.before };
  const order = options.order ?? "desc";
  const [logs, dailies] = await Promise.all([
    prisma.seanceLog.findMany({ where: { userId, date },
      orderBy: [{ date: order }, { createdAt: order }, { id: order }], take: options.take }),
    prisma.dailySession.findMany({ where: { userId, date, completedAt: { not: null } },
      select: { id: true, userId: true, date: true, completedAt: true, adaptedSession: true,
        feedbackComment: true, workoutRating: true, feedbackPain: true },
      orderBy: [{ date: order }, { completedAt: order }, { id: order }], take: options.take }),
  ]);
  // Distinct identities: never collapse two workouts merely because they share a day.
  const entries: WorkoutHistoryEntry[] = [...logs, ...dailies.flatMap(daily => {
    const entry = dailyHistoryEntry(daily);
    return entry ? [entry] : [];
  })];
  entries.sort((a, b) => (order === "asc" ? 1 : -1) * (
    a.date.getTime() - b.date.getTime() || a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id)
  ));
  return options.take === undefined ? entries : entries.slice(0, options.take);
}

export async function workoutHistoryCount(userId: string, options: Pick<HistoryOptions, "from" | "before"> = {}) {
  const date = { gte: options.from, lt: options.before };
  const [logs, dailies] = await Promise.all([
    prisma.seanceLog.count({ where: { userId, date } }),
    prisma.dailySession.count({ where: { userId, date, completedAt: { not: null } } }),
  ]);
  return logs + dailies;
}
