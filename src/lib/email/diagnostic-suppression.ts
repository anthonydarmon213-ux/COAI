import { prisma } from "@/lib/db/client";
import { canSendDiagnosticReminder, type DiagnosticReminderField } from "./diagnostic-cadence";

export async function isDiagnosticReminderDue(email: string, field: DiagnosticReminderField): Promise<boolean> {
  const history = await prisma.diagnosticLead.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { conversionReminderSentAt: true, drip3SentAt: true, drip5SentAt: true, drip7SentAt: true },
  });
  return canSendDiagnosticReminder(history, field, Date.now());
}

// Le désabonnement porte sur l'adresse, pas seulement sur un bilan.
// Relire juste avant l'envoi couvre aussi les candidats sélectionnés avant
// un désabonnement et les adresses possédant plusieurs bilans.
export async function hasDiagnosticOptOut(email: string): Promise<boolean> {
  const lead = await prisma.diagnosticLead.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      optedOutAt: { not: null },
    },
    select: { id: true },
  });
  return Boolean(lead);
}
