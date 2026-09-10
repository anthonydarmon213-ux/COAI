import { trackEvent, trackMetaEvent } from "@/lib/analytics";
import { hasConsent } from "./consent";

export const ANALYTICS_READY_EVENT = "coai:analytics-ready";

export type Conversion = {
  name: string;
  params?: Record<string, unknown>;
  metaEvent?: string;
  metaParams?: Record<string, unknown>;
  onceKey?: string;
};

// Un accusé local signifie « transmis au SDK », pas « reçu par GA4/Meta ».
// Les canaux sont indépendants : le consentement Google ne vaut pas pour Meta.
export function createConversionTracker(conversion: Conversion): () => void {
  const sent = { audience: false, marketing: false };
  return () => {
    if (typeof window === "undefined") return;
    const base = conversion.onceKey ? `coai_conversion_${conversion.name}_${conversion.onceKey}` : null;
    for (const purpose of ["audience", "marketing"] as const) {
      if (sent[purpose] || !hasConsent(purpose) || (purpose === "marketing" && !conversion.metaEvent)) continue;
      try {
        const key = base ? `${base}_${purpose}` : null;
        // L'ancien marqueur ne distingue pas les canaux. Ne pas rejouer une
        // conversion historique dont on ne connaît pas le destinataire.
        if (base && (window.localStorage.getItem(base) || window.localStorage.getItem(key!))) {
          sent[purpose] = true;
          continue;
        }
        const accepted = purpose === "audience"
          ? trackEvent(conversion.name, conversion.params)
          : trackMetaEvent(conversion.metaEvent!, conversion.metaParams);
        if (accepted) {
          sent[purpose] = true;
          if (key) window.localStorage.setItem(key, "1");
        }
      } catch { /* Une mesure facultative ne doit jamais bloquer le parcours. */ }
    }
  };
}
