// Notification push sur le téléphone d'Anthony via ntfy.sh (14/08/2026) —
// contourne le problème de fond des emails de notification admin (Resend
// confirme "Delivered" mais les emails finissent en spam faute de domaine
// d'envoi vérifié, cf. onboarding@resend.dev par défaut ci-dessous).
// Aucun compte à créer côté ntfy : POST simple vers un "topic" que seul
// Anthony connaît (équivalent d'un mot de passe), auquel il s'abonne dans
// l'app ntfy sur son téléphone. Best-effort, jamais bloquant.
// Les en-têtes HTTP n'acceptent que de l'ASCII (fetch/undici lève une
// exception sur un accent dans une valeur de header) — nos sujets contiennent
// systématiquement des accents ("à valider", "généré"...). Le titre affiché
// à l'écran de verrouillage passe donc par le header (sans accent), le sujet
// Les push utilisent désormais un texte générique : aucun sujet d'email,
// nom, contact ou contenu de diagnostic ne doit être transmis à ntfy.
// Ne garde que de l'ASCII pur (code point <= 127) : un header HTTP est un
// ByteString, fetch/undici lève une exception dès qu'un caractère dépasse
// 255 (ex: le tiret cadratin "—", U+2014, utilisé dans plusieurs sujets de
// notification) — un simple retrait des diacritiques ne suffit pas. D'abord
// décomposé en NFD pour que "é"/"à" deviennent une lettre de base + un
// diacritique séparé (filtré ensuite), plutôt que d'être supprimés en bloc.
function toAscii(value: string): string {
  const avecTiretsSimples = value.replace(/[–—]/g, "-"); // tirets cadratin/demi-cadratin → tiret simple, avant le filtre ASCII ci-dessous
  return Array.from(avecTiretsSimples.normalize("NFD"))
    .filter((char) => (char.codePointAt(0) ?? 0) <= 127)
    .join("");
}

async function sendPushNotification(): Promise<void> {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;
  const server = process.env.NTFY_SERVER ?? "https://ntfy.sh";
  try {
    const res = await fetch(`${server}/${topic}`, {
      method: "POST",
      // A push may appear on a locked phone and is processed by another
      // provider. Never forward the email subject or its personal content.
      headers: { Title: toAscii("COAI — notification coach"), Priority: "high" },
      body: "Une nouvelle notification COAI est disponible. Consulte ta messagerie coach.",
    });
    if (!res.ok) {
      console.error("[push] ntfy a répondu une erreur", res.status);
    }
  } catch {
    console.error("[push] Échec de l'envoi");
  }
}

// Envoi d'emails transactionnels via l'API Resend (pas de SDK, simple fetch
// comme pour l'intégration Make.com). Best-effort : ne bloque jamais le flux
// principal si l'email échoue ou n'est pas configuré.
// `html` (11/08/2026, amélioration workflow coach) : optionnel, pour les
// notifications qui méritent un vrai CTA plutôt qu'une URL brute dans du
// texte — Resend accepte `text` et `html` en parallèle (la plupart des
// clients mail affichent `html` s'il est présent, `text` sert de secours).
// Envoie aussi une notification push (ci-dessus) en parallèle, indépendante
// de l'email — l'une des deux peut échouer sans affecter l'autre.
export async function sendAdminNotification(subject: string, text: string, html?: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;

  await Promise.all([
    apiKey && to
      ? sendEmail(to, subject, text, html)
      : Promise.resolve(
          console.warn("[email] RESEND_API_KEY ou ADMIN_NOTIFICATION_EMAIL non configuré, notification ignorée")
        ),
    sendPushNotification(),
  ]);
}

// Envoi générique (destinataire quelconque), utilisé pour les emails vers
// les abonnés eux-mêmes (ex : relance inactivité) plutôt que vers Anthony.
// Retourne false si l'envoi échoue ou n'est pas configuré, pour permettre à
// l'appelant de compter les échecs sans lever d'exception.
export async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
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
        ...(html ? { html } : {}),
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend a répondu une erreur", res.status);
      return false;
    }
    return true;
  } catch {
    console.error("[email] Échec de l'envoi");
    return false;
  }
}
