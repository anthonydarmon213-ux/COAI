// Intégration avec l'assistant WhatsApp existant "Coaching 2.0" (Make.com + Twilio).
// Lab Coach ne réimplémente pas de chat : on échange uniquement des événements/contexte.

type NotifyMakePayload = {
  userId: string;
  event: "profile_updated" | "programme_generated";
  data: Record<string, unknown>;
};

// Notifie le scénario Make.com pour que l'IA WhatsApp dispose du contexte à jour
// (objectifs, dernier programme) lors de la prochaine conversation.
export async function notifyMakeScenario(payload: NotifyMakePayload): Promise<void> {
  const url = process.env.MAKE_OUTGOING_WEBHOOK_URL;
  if (!url) {
    throw new Error("MAKE_OUTGOING_WEBHOOK_URL manquant dans l'environnement");
  }

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// Valide la provenance d'un appel entrant depuis Make.com (webhook secret partagé).
export function isValidWhatsappWebhookRequest(request: Request): boolean {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  const provided = request.headers.get("x-webhook-secret");
  return Boolean(secret) && provided === secret;
}
