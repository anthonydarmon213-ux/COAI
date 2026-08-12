// Mémorise l'intention "Transformation" (?plan=STANDARD depuis le bouton
// S'abonner de /pricing pour un visiteur non connecté, redirigé vers
// /sign-up) le temps de l'inscription — nécessaire pour survivre à
// l'aller-retour Google OAuth, qui ne repasse pas par /sign-up au retour.
// Sans ça, un visiteur qui clique "S'abonner — Transformation 49€/mois"
// se retrouvait silencieusement inscrit sur l'offre Impulsion (7 jours
// offerts) une fois son compte créé. Cookie non httpOnly (lu/écrit côté
// client uniquement), courte durée de vie, aucune donnée sensible.
const COOKIE_NAME = "coai_plan";
const BILLING_COOKIE_NAME = "coai_billing";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 3; // 3 jours

export function storeIntendedPlanCookie(plan: "STANDARD") {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${plan}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function storeIntendedBillingCookie(billing: "ANNUAL") {
  if (typeof document === "undefined") return;
  document.cookie = `${BILLING_COOKIE_NAME}=${billing}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function readIntendedPlanCookie(): "STANDARD" | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match?.[1] === "STANDARD" ? "STANDARD" : null;
}

export function clearIntendedPlanCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  document.cookie = `${BILLING_COOKIE_NAME}=; path=/; max-age=0`;
}
