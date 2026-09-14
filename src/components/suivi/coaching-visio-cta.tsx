import type { EffectivePlan } from "@/lib/subscription/plan";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import Link from "next/link";

const MESSAGE_VIP = "Bonjour Anthony, je suis abonné VIP COAI et je souhaite organiser mes séances privées du mois.";
const MESSAGE_CONTACT = "Bonjour Anthony, j'aimerais une précision sur mon accompagnement COAI.";

export function CoachingVisioCta({ plan }: { plan?: EffectivePlan } = {}) {
  const estVip = plan === "PREMIUM";
  const href = buildWhatsAppLink(estVip ? MESSAGE_VIP : MESSAGE_CONTACT);
  if (!estVip) return (
    <div className="flex flex-col gap-3 rounded-lg border border-graphite-800 bg-graphite-900/40 p-5">
      <span className="font-mono text-xs uppercase tracking-widest text-laiton-400">COAI Club · Le rendez-vous humain</span>
      <p className="text-sm text-graphite-200">Une heure de questions-réponses en groupe avec Anthony chaque mois, en direct uniquement, sans replay. Propose tes questions en amont ; une réponse individuelle à chaque question n’est pas garantie.</p>
      <Link href="/club" className="coai-vip-button inline-flex min-h-11 w-fit items-center rounded-xl px-5 py-3 text-sm font-extrabold">Voir le direct mensuel →</Link>
      {href && <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm text-graphite-300 underline">Une question sur ton accompagnement ?</a>}
    </div>
  );
  if (!href) return null;

  return (
    <div className="group relative flex flex-col gap-2 overflow-hidden rounded-lg border border-graphite-800 bg-graphite-900/40 p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-laiton-500/10 blur-2xl transition group-hover:bg-laiton-500/20" />
      <span className="font-mono text-xs uppercase tracking-widest text-laiton-400">
        Tes séances privées VIP
      </span>
      <p className="text-sm text-graphite-200">
            Ton abonnement inclut le rythme choisi : 1, 2, 3 ou 4 séances privées chaque mois,
            en visio ou à Paris centre. Organise tes créneaux directement avec Anthony.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="coai-vip-button mt-2 inline-flex w-fit rounded-xl px-5 py-3 text-sm font-extrabold shadow-sm transition"
      >
        Organiser mes séances VIP →
      </a>
    </div>
  );
}
