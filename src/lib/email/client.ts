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
  await sendEmail(to, subject, text);
}

// Envoi générique (destinataire quelconque), utilisé pour les emails vers
// les abonnés eux-mêmes (ex : relance inactivité) plutôt que vers Anthony.
// Retourne false si l'envoi échoue ou n'est pas configuré, pour permettre à
// l'appelant de compter les échecs sans lever d'exception.
export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY non configuré, envoi ignoré");
    return false;
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
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Échec de l'envoi", err);
    return false;
  }
}
