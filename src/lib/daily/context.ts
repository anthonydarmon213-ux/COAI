import type { DailySession } from "@prisma/client";
import { getWorkoutForDate, type WorkoutSession } from "@/lib/daily/session";

export function resolveDailyContext(
  programme: { id: string; version: number; contenu: unknown } | null,
  daily: DailySession | null,
  date: Date
) {
  const current = programme ? getWorkoutForDate(programme.contenu, date) : null;
  const stored = daily?.sourceSession;
  const hasStoredSession = stored && typeof stored === "object" && !Array.isArray(stored);
  if (programme && daily?.completedAt && hasStoredSession) {
    return { sourceSession: stored as WorkoutSession, initialDaily: daily,
      programmeVersion: daily.programmeVersion ?? programme.version, changed: false };
  }
  const changed = Boolean(daily && !daily.completedAt && programme && (
    daily.programmeSourceId !== programme.id || daily.programmeVersion !== programme.version ||
    JSON.stringify(daily.sourceSession) !== JSON.stringify(current)
  ));
  return { sourceSession: current, initialDaily: changed ? null : daily,
    programmeVersion: programme?.version ?? 0, changed };
}
