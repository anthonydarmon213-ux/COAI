// Intégration avec l'assistant WhatsApp existant "Coaching 2.0" (Make.com + Twilio).
// L'application ne réimplémente pas de chat : on échange uniquement des événements/contexte.

type NotifyMakePayload = {
  userId: string;
  event: "profile_updated" | "programme_generated";
  data: Record<string, unknown>;
};

// Notifie le scénario Make.com pour que l'IA WhatsApp dispose du contexte à jour
// (objectifs, dernier programme) lors de la prochaine conversation.
// Best-effort : ne bloque jamais le flux principal (sauvegarde profil, validation
// coach...) si Make.com n'est pas configuré ou temporairement indisponible.
export async function notifyMakeScenario(payload: NotifyMakePayload): Promise<void> {
  const url = process.env.MAKE_OUTGOING_WEBHOOK_URL;
  if (!url) {
    console.warn("[whatsapp] MAKE_OUTGOING_WEBHOOK_URL non configuré, notification ignorée");
    return;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Optional synchronisation must not hold a saved profile indefinitely.
      // No automatic retry: avoid duplicate deliveries and additional usage.
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      console.error("[whatsapp] Notification Make.com refusée par le service distant");
    }
  } catch {
    // Errors may include the webhook URL (secret) or request data. Do not log
    // them, and never retry an optional paid workflow automatically.
    console.error("[whatsapp] Notification Make.com indisponible ou délai dépassé");
  }
}

// Valide la provenance d'un appel entrant depuis Make.com (webhook secret partagé).
export function isValidWhatsappWebhookRequest(request: Request): boolean {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET;
  const provided = request.headers.get("x-webhook-secret");
  return Boolean(secret) && provided === secret;
}
