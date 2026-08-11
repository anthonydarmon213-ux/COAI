declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    // Injecté par le Pixel Meta (cf. src/components/analytics/meta-pixel.tsx)
    // — absent tant que NEXT_PUBLIC_META_PIXEL_ID n'est pas configuré.
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}

// Événements de conversion Meta (Facebook/Instagram Ads) — jusqu'au
// 11/08/2026, le Pixel n'envoyait que "PageView" : aucun signal de
// conversion réelle (lead, inscription, abonnement) ne remontait à Meta,
// donc l'algorithme de diffusion des pubs payantes ne pouvait optimiser que
// sur les vues de page, pas sur qui convertit vraiment — un vrai manque à
// gagner sur le budget pub déjà dépensé (cf. CLAUDE.md, test Meta/Instagram
// du 09/08/2026). `name` doit être un des événements standards Meta (Lead,
// CompleteRegistration, StartTrial, Subscribe, Purchase...) pour bénéficier
// de l'optimisation algorithmique — un nom personnalisé fonctionne aussi
// mais avec moins de signal côté Meta.
export function trackMetaEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", name, params);
}
