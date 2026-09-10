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

// Même cadence destinataire que les relances du bilan, mais autorisée pour
// un compte déjà créé. L'éligibilité métier est relue après réservation.
export async function sendFirstValueReminder(request: {
  userId: string;
  email: string;
  eligible: () => Promise<boolean>;
  subject: string;
  text: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const normalized = request.email.trim().toLowerCase();
  const recipientKey = createHash("sha256").update(normalized).digest("hex");
  const eventKey = createHash("sha256").update(request.userId).digest("hex");
  const result = await deliverOnce(registryDatabase, {
    recipientKey,
    deliveryKey: `first-value:${eventKey}`,
    kind: "first-value",
    eligible: async () => !(await hasDiagnosticOptOut(normalized)) && await request.eligible(),
    send: () => sendEmail(normalized, request.subject, request.text),
  });
  return result === "SENT";
}
