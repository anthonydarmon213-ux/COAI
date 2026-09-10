// Runtime origin, not the build environment: a production build may also be
// served on a preview/alias URL. Never mix its visits with customer conversions.
export function isProductionAnalyticsOrigin(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "https:" &&
    ["coai.fr", "www.coai.fr"].includes(window.location.hostname);
}
