import type { EffectivePlan } from "@/lib/subscription/plan";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const MESSAGE_VIP = "Bonjour Anthony, je suis abonné VIP COAI et je souhaite organiser mes séances privées du mois.";
const MESSAGE_HYBRIDE = "Bonjour Anthony, je suis abonné Coaching Hybride COAI et j'aimerais faire un point sur mon accompagnement.";

export function CoachingVisioCta({ plan }: { plan?: EffectivePlan } = {}) {
  const estVip = plan === "PREMIUM";
  const href = buildWhatsAppLink(estVip ? MESSAGE_VIP : MESSAGE_HYBRIDE);
  if (!href) return null;

  return (
    <div className="group relative flex flex-col gap-2 overflow-hidden rounded-lg border border-graphite-800 bg-graphite-900/40 p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-laiton-500/10 blur-2xl transition group-hover:bg-laiton-500/20" />
      <span className="font-mono text-xs uppercase tracking-widest text-laiton-400">
        {estVip ? "Tes séances privées VIP" : "Accompagnement hybride"}
      </span>
      <p className="text-sm text-graphite-200">
        {estVip ? (
          <>
            Ton abonnement inclut le rythme choisi : 1, 2, 3 ou 4 séances privées chaque mois,
            en visio ou à Paris centre. Organise tes créneaux directement avec Anthony.
          </>
        ) : (
          <>L&apos;IA reste disponible 24/7 et l&apos;humain apporte le recul, la nuance et les ajustements.</>
        )}
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="coai-vip-button mt-2 inline-flex w-fit rounded-xl px-5 py-3 text-sm font-extrabold shadow-sm transition"
      >
        {estVip ? "Organiser mes séances VIP →" : "Échanger avec Anthony →"}
      </a>
    </div>
  );
}
