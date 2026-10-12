// The coaching and its @db.Date key follow the French calendar, independent
// of the server timezone and the summer/winter clock changes.
const calendar = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
});
const weekday = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris', weekday: 'long',
});

export function parisCalendarDate(now = new Date()): Date {
  const parts = Object.fromEntries(calendar.formatToParts(now).map(part => [part.type, part.value]));
  return new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
}

export function parisWeekday(now = new Date()): string {
  return weekday.format(now);
}
