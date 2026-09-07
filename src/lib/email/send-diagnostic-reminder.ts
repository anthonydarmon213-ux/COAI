import { createHash } from "crypto";
import { prisma } from "@/lib/db/client";
import { sendEmail } from "./client";
import { deliverOnce } from "./delivery-registry";
import { registryDatabase } from "./registry-prisma";
import { hasDiagnosticOptOut, isDiagnosticReminderDue } from "./diagnostic-suppression";
import type { DiagnosticReminderField } from "./diagnostic-cadence";

export async function sendDiagnosticReminder(email: string, field: DiagnosticReminderField, subject: string, text: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const normalized = email.trim().toLowerCase();
  const recipientKey = createHash("sha256").update(normalized).digest("hex");
  const result = await deliverOnce(registryDatabase, {
    recipientKey,
    deliveryKey: `diagnostic:${recipientKey}:${field}`,
    kind: field,
    eligible: async () => {
      if (await hasDiagnosticOptOut(normalized)) return false;
      if (await prisma.user.findFirst({ where: { email: { equals: normalized, mode: "insensitive" } }, select: { id: true } })) return false;
      return isDiagnosticReminderDue(normalized, field);
    },
    send: () => sendEmail(normalized, subject, text),
  });
  return result === "SENT";
}
