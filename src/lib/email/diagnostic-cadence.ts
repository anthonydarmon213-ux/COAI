export type DiagnosticReminderField = "conversionReminderSentAt" | "drip3SentAt" | "drip5SentAt" | "drip7SentAt";
type ReminderHistory = Record<DiagnosticReminderField, Date | null>;
const FIELDS: DiagnosticReminderField[] = ["conversionReminderSentAt", "drip3SentAt", "drip5SentAt", "drip7SentAt"];

// Plusieurs bilans ne doivent ni réarmer une étape ni raccourcir l'espacement.
export function canSendDiagnosticReminder(history: ReminderHistory[], field: DiagnosticReminderField, now: number): boolean {
  if (history.some(row => row[field] !== null)) return false;
  return !history.some(row => FIELDS.some(key => {
    const sent = row[key];
    return sent !== null && now - sent.getTime() < 48 * 60 * 60 * 1000;
  }));
}
