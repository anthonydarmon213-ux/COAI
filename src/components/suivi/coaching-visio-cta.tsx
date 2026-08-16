import type { EffectivePlan } from "@/lib/subscription/plan";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const MESSAGE_VIP =
  "Bonjour Anthony, je suis sur mon espace COAI et j'aimerais réserver une séance VIP (présentiel ou visio).";

// Transformation (14/08/2026, corrigé — c'était par erreur décrit comme
// "incluse chaque mois") : la séance visio de 30 min avec Anthony Darmon
// est offerte une seule fois par abonné, pas un avantage récurrent. Au-delà
// de cette première séance, toute nouvelle séance passe par l'offre VIP
// payante à la séance — même message WhatsApp que VIP pour ne pas laisser
// entendre un droit mensuel qui n'existe pas.
const MESSAGE_INCLUSE =
  "Bonjour Anthony, je suis abonné Transformation sur COAI et j'aimerais réserver ma séance visio de 30 min offerte.";

// Les séances de coaching individuel (VIP) sont réservées et payées à la
// séance, hors abonnement — accessibles à tous les paliers, y compris
// Gratuit. Transformation a en plus une séance visio de 30 min offerte une
// seule fois, d'où le message dédié — toute séance suivante redevient VIP.
export function CoachingVisioCta({ plan }: { plan?: EffectivePlan } = {}) {
  const estTransformation = plan === "STANDARD";
  const href = buildWhatsAppLink(estTransformation ? MESSAGE_INCLUSE : MESSAGE_VIP);
  if (!href) return null;

  return (
    <div className="group relative flex flex-col gap-2 overflow-hidden rounded-lg border border-graphite-800 bg-graphite-900/40 p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-laiton-500/10 blur-2xl transition group-hover:bg-laiton-500/20" />
      <span className="font-mono text-xs uppercase tracking-widest text-laiton-400">
        {estTransformation ? "Ta séance visio offerte" : "Coaching VIP · Places limitées"}
      </span>
      <p className="text-sm text-graphite-200">
        {estTransformation ? (
          <>
            Ta formule Transformation inclut 1 séance visio de 30 min offerte avec Anthony Darmon
            — profites-en pour faire un point sur ta progression. Au-delà de cette première
            séance, réserve via l&apos;offre VIP, à la séance.
          </>
        ) : (
          <>Un accompagnement humain, précis et adapté à ta progression.</>
        )}
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="coai-vip-button mt-2 inline-flex w-fit rounded-xl px-5 py-3 text-sm font-extrabold shadow-sm transition"
      >
        {estTransformation
          ? "Réserver ma séance visio offerte →"
          : "Voir les disponibilités avec Anthony →"}
      </a>
      {estTransformation && (
        <p className="mt-1 text-xs leading-5 text-graphite-400">
          Première séance incluse dans Transformation. Les tarifs VIP s&apos;appliquent uniquement
          si tu souhaites réserver d&apos;autres séances ensuite.
        </p>
      )}
    </div>
  );
}
