// Envoi d'emails transactionnels via l'API Resend (pas de SDK, simple fetch
// comme pour l'intégration Make.com). Best-effort : ne bloque jamais le flux
// principal si l'email échoue ou n'est pas configuré.
export async function sendAdminNotification(subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!apiKey || !to) {
    console.warn("[email] RESEND_API_KEY ou ADMIN_NOTIFICATION_EMAIL non configuré, notification ignorée");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "COAI <onboarding@resend.dev>",
        to,
        subject,
        text,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend a répondu une erreur", res.status, await res.text());
    }
  } catch (err) {
    console.error("[email] Échec de l'envoi de la notification", err);
  }
}
