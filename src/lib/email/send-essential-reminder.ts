import { createHash } from "node:crypto";
import { deliverOnce } from "./delivery-registry";
import { registryDatabase } from "./registry-prisma";

// Les rappels de service ont un verrou par événement, pas le délai marketing
// de tout un destinataire : un email promotionnel ne doit jamais bloquer un
// rappel de paiement. Aucun email ni contenu personnel dans les clés.
export async function sendEssentialReminder(request: {
  kind: "trial-activation" | "payment-recovery";
  eventId: string;
  eligible: () => Promise<boolean>;
  send: () => Promise<boolean>;
}): Promise<boolean> {
  // Ne pas réserver définitivement un message si l'envoi n'est pas configuré.
  if (!process.env.RESEND_API_KEY) return false;
  const key = `essential:${request.kind}:${createHash("sha256").update(request.eventId).digest("hex")}`;
  const outcome = await deliverOnce(registryDatabase, {
    deliveryKey: key,
    recipientKey: key,
    kind: request.kind,
    eligible: request.eligible,
    send: request.send,
  });
  return outcome === "SENT";
}
