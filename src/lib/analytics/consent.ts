export const CONSENT_KEY = "coai_privacy_v1";
export const CONSENT_EVENT = "coai:privacy-change";
export type PrivacyChoices = { audience: boolean; marketing: boolean };
export const REFUSE_ALL: PrivacyChoices = { audience: false, marketing: false };

// A capability marker supplied by our WKWebView, not an identity or access check.
// Until ATT and the final iOS privacy review exist, optional trackers stay off.
export function isNativeIOSApp(): boolean {
  return typeof window !== "undefined" && /(?:^|\s)COAIiOS\/\d+(?:\s|$)/.test(window.navigator?.userAgent ?? "");
}

export function readConsent(): PrivacyChoices | null {
  if (typeof window === "undefined") return null;
  if (isNativeIOSApp()) return REFUSE_ALL;
  try {
    const value = JSON.parse(window.localStorage.getItem(CONSENT_KEY) ?? "null");
    if (!value || value.version !== 1 || typeof value.expiresAt !== "number" || value.expiresAt <= Date.now()
      || typeof value.audience !== "boolean" || typeof value.marketing !== "boolean") return null;
    return { audience: value.audience, marketing: value.marketing };
  } catch { return null; }
}

export function hasConsent(purpose: keyof PrivacyChoices): boolean {
  return readConsent()?.[purpose] === true;
}

export function saveConsent(choices: PrivacyChoices): boolean {
  if (isNativeIOSApp()) return false; // Do not overwrite a stored website choice.
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...choices, version: 1, expiresAt: Date.now() + 180 * 86400000 }));
    window.dispatchEvent(new Event(CONSENT_EVENT));
    return true;
  } catch { return false; }
}
