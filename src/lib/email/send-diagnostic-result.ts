import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { deliverOnce } from "./delivery-registry";
import { registryDatabase } from "./registry-prisma";

const COOLDOWN_MS = 5 * 60 * 1000;

// Résultat demandé par le visiteur, indépendant du consentement marketing.
// Le verrou est propre à ce type d'email : une relance ne bloque pas le bilan.
export async function sendDiagnosticResult(request: {
  leadId: string;
  email: string;
  send: () => Promise<boolean>;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  const email = request.email.trim().toLowerCase();
  const recipientKey = `diagnostic-result:${createHash("sha256").update(email).digest("hex")}`;
  const outcome = await deliverOnce(registryDatabase, {
    recipientKey,
    deliveryKey: `${recipientKey}:${request.leadId}`,
    kind: "diagnostic-result",
    cooldownHours: COOLDOWN_MS / 3600000,
    eligible: async () => {
      const lead = await prisma.diagnosticLead.findFirst({
        where: { id: request.leadId, email: { equals: email, mode: "insensitive" }, resultEmailSentAt: null },
        select: { id: true },
      });
      if (!lead) return false;
      // Compatibilité avec les emails envoyés avant le registre. Relire
      // après réservation, jamais simplement avant une écriture concurrente.
      const recent = await prisma.diagnosticLead.findFirst({
        where: { email: { equals: email, mode: "insensitive" },
          resultEmailSentAt: { not: null, gte: new Date(Date.now() - COOLDOWN_MS) } },
        select: { id: true },
      });
      return !recent;
    },
    send: request.send,
  });
  return outcome === "SENT";
}
