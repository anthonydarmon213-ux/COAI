// Attribution publicitaire (Phase 5B, 11/08/2026) : mémorise les paramètres
// utm_* de la première visite le temps de la conversion — nécessaire pour
// savoir plus tard "cette personne vient de cette pub" (Instagram/TikTok/
// Meta Ads, cf. CLAUDE.md). Même pattern que le cookie de parrainage
// (src/lib/parrainage/cookie.ts) : cookie non httpOnly, léger, survit à
// l'aller-retour Google OAuth qui ne repasse pas par /sign-up au retour.
// First-touch : on n'écrase jamais un attribut déjà capturé par une visite
// ultérieure sans UTM (sinon une visite organique après un clic pub ferait
// perdre l'attribution d'origine).
const COOKIE_NAME = "coai_utm";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 jours

export type UtmParams = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

const PARAM_KEYS: Record<keyof UtmParams, string> = {
  utmSource: "utm_source",
  utmMedium: "utm_medium",
  utmCampaign: "utm_campaign",
  utmContent: "utm_content",
  utmTerm: "utm_term",
};

// Lit les utm_* présents dans l'URL courante — ne fait rien si aucun n'est
// présent (ne jamais casser une URL sans UTM, ni écraser un cookie existant).
export function captureUtmFromLocation(): void {
  if (typeof window === "undefined") return;
  if (readUtmCookie()) return; // déjà capturé (first-touch)

  const search = new URLSearchParams(window.location.search);
  const params: UtmParams = {};
  let hasAny = false;
  for (const [key, param] of Object.entries(PARAM_KEYS) as [keyof UtmParams, string][]) {
    const value = search.get(param);
    if (value) {
      params[key] = value;
      hasAny = true;
    }
  }
  if (hasAny) storeUtmCookie(params);
}

export function storeUtmCookie(params: UtmParams): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(params))}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function readUtmCookie(): UtmParams | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (!match?.[1]) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as UtmParams;
  } catch {
    return null;
  }
}

export function clearUtmCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}
