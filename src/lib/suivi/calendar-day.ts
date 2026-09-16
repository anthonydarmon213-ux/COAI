// Une date de repas représente un jour civil, pas l'instant de sa saisie.
export function localCalendarDay(now = new Date()): string {
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}

export function isCalendarDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function calendarDayBounds(day: string) {
  if (!isCalendarDay(day)) throw new Error("Jour invalide");
  const start = new Date(day + "T00:00:00.000Z");
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}
