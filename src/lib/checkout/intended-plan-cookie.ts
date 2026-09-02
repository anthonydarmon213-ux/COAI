// Mémorise l'intention "Coaching Hybride" (?plan=STANDARD depuis le bouton
// S'abonner de /pricing pour un visiteur non connecté, redirigé vers
// /sign-up) le temps de l'inscription — nécessaire pour survivre à
// l'aller-retour Google OAuth, qui ne repasse pas par /sign-up au retour.
// Sans ça, un visiteur qui clique "S'abonner — Coaching Hybride 99€/mois"
// se retrouvait silencieusement inscrit sur l'offre Pass IA (7 jours
// offerts) une fois son compte créé. Cookie non httpOnly (lu/écrit côté
// client uniquement), courte durée de vie, aucune donnée sensible.
const COOKIE_NAME = "coai_plan";
const VIP_SESSIONS_COOKIE_NAME = "coai_vip_sessions";
const BILLING_COOKIE_NAME = "coai_billing";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 3; // 3 jours

export type IntendedPlan = "PASS_IA" | "STANDARD" | "PREMIUM";
export type IntendedBilling = "MONTHLY" | "QUARTERLY" | "ANNUAL";

export function storeIntendedPlanCookie(
  plan: IntendedPlan,
  vipSessions: 1 | 2 | 3 | 4 = 1,
  billing: IntendedBilling = "MONTHLY"
) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${plan}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
  document.cookie = `${VIP_SESSIONS_COOKIE_NAME}=${vipSessions}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
  document.cookie = `${BILLING_COOKIE_NAME}=${billing}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function readIntendedBillingCookie(): IntendedBilling {
  if (typeof document === "undefined") return "MONTHLY";
  const match = document.cookie.match(new RegExp(`(?:^|; )${BILLING_COOKIE_NAME}=([^;]*)`));
  if (match?.[1] === "ANNUAL") return "ANNUAL";
  if (match?.[1] === "QUARTERLY") return "QUARTERLY";
  return "MONTHLY";
}

export function readIntendedPlanCookie(): IntendedPlan | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  // Un visiteur entre dans le tunnel avant le renommage garde "GRATUIT" dans
  // son navigateur : sans cette equivalence son intention serait perdue et il
  // arriverait au paiement sans formule selectionnee.
  if (match?.[1] === "GRATUIT") return "PASS_IA";
  return match?.[1] === "PASS_IA" || match?.[1] === "STANDARD" || match?.[1] === "PREMIUM"
    ? match[1]
    : null;
}

export function readIntendedVipSessionsCookie(): 1 | 2 | 3 | 4 {
  if (typeof document === "undefined") return 1;
  const match = document.cookie.match(new RegExp(`(?:^|; )${VIP_SESSIONS_COOKIE_NAME}=([^;]*)`));
  const count = Number(match?.[1]);
  return count === 2 || count === 3 || count === 4 ? count : 1;
}

export function clearIntendedPlanCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  document.cookie = `${VIP_SESSIONS_COOKIE_NAME}=; path=/; max-age=0`;
  document.cookie = `${BILLING_COOKIE_NAME}=; path=/; max-age=0`;
}
