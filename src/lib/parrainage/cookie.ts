// Mémorise le code de parrainage (?ref=CODE) le temps de l'inscription —
// nécessaire pour survivre à l'aller-retour Google OAuth, qui ne repasse
// pas par /sign-up au retour. Cookie non httpOnly (lu/écrit côté client
// uniquement), courte durée de vie, aucune donnée sensible.
const COOKIE_NAME = "coai_ref";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 3; // 3 jours

export function storeParrainageCookie(code: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(code)}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function readParrainageCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function clearParrainageCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
