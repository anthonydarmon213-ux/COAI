import { createHmac, timingSafeEqual } from "crypto";

// Jeton de désabonnement (16/08/2026, séquence de nurture post-diagnostic) —
// réutilise CRON_SECRET plutôt que d'exiger une nouvelle variable d'env
// avant de pouvoir déployer : un HMAC ne révèle jamais le secret utilisé
// pour le calculer, seul un attaquant connaissant déjà CRON_SECRET pourrait
// forger un lien. Anthony peut créer un EMAIL_UNSUB_SECRET dédié plus tard
// si besoin, sans rien casser (les liens déjà envoyés resteraient valides
// tant que CRON_SECRET ne change pas).
function secret(): string | null {
  return process.env.EMAIL_UNSUB_SECRET ?? process.env.CRON_SECRET ?? null;
}

export function buildUnsubscribeToken(email: string): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key).update(email.toLowerCase()).digest("hex");
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = buildUnsubscribeToken(email);
  if (!expected) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function buildUnsubscribeLink(appUrl: string, email: string): string | null {
  const token = buildUnsubscribeToken(email);
  if (!token) return null;
  return `${appUrl}/api/diagnostic-lead/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}
