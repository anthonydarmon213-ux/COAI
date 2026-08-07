import type { EffectivePlan } from "@/lib/subscription/plan";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const MESSAGE =
  "Bonjour Anthony, je suis sur mon espace COAI et j'aimerais réserver une séance VIP (présentiel ou visio).";

// Les séances de coaching individuel (VIP) sont réservées et payées à la
// séance, hors abonnement — accessibles à tous les paliers, y compris
// Gratuit. `plan` n'influence plus le message affiché ; gardé en prop pour
// un futur usage éventuel (ex: mise en avant différenciée par palier).
export function CoachingVisioCta({ plan: _plan }: { plan?: EffectivePlan } = {}) {
  const href = buildWhatsAppLink(MESSAGE);
  if (!href) return null;

  return (
    <div className="group relative flex flex-col gap-2 overflow-hidden rounded-lg border border-graphite-800 bg-graphite-900/40 p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-laiton-500/10 blur-2xl transition group-hover:bg-laiton-500/20" />
      <span className="font-mono text-xs uppercase tracking-widest text-laiton-400">
        Coaching VIP · Présentiel ou visio
      </span>
      <p className="text-sm text-graphite-200">
        Un besoin plus poussé que ce que le programme couvre ? Réserve une séance individuelle
        avec Anthony Darmon — présentiel à Paris centre (200€/1h) ou en visio (100€/1h), sans
        abonnement.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 text-sm font-medium text-laiton-300 hover:text-laiton-200"
      >
        Réserver via WhatsApp →
      </a>
    </div>
  );
}
