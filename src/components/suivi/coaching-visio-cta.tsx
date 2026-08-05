import Link from "next/link";
import type { EffectivePlan } from "@/lib/subscription/plan";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_COACH_NUMBER;

const MESSAGE =
  "Bonjour Anthony, je suis sur mon espace YUMAI et j'aimerais échanger en visio sur mon accompagnement.";

export function CoachingVisioCta({ plan }: { plan?: EffectivePlan } = {}) {
  if (!WHATSAPP_NUMBER) return null;

  const isPremium = plan === "PREMIUM";
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <div className="group relative flex flex-col gap-2 overflow-hidden rounded-lg border border-graphite-800 bg-graphite-900/40 p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-laiton-500/10 blur-2xl transition group-hover:bg-laiton-500/20" />
      <span className="font-mono text-xs uppercase tracking-widest text-laiton-400">
        Coaching humain · Visio
      </span>
      {isPremium ? (
        <>
          <p className="text-sm text-graphite-200">
            Ta séance mensuelle en présentiel (Paris) ou en visio est incluse dans ton offre
            Premium. Réserve-la directement avec Anthony.
          </p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 text-sm font-medium text-laiton-300 hover:text-laiton-200"
          >
            Réserver ma séance incluse →
          </a>
        </>
      ) : (
        <>
          <p className="text-sm text-graphite-200">
            Un besoin plus poussé que ce que le programme couvre ? L&apos;offre Premium (199€/mois)
            inclut 1 séance/mois en présentiel ou en visio avec Anthony Darmon — une version light
            de THE METHOD.
          </p>
          <Link
            href="/pricing"
            className="mt-1 text-sm font-medium text-laiton-300 hover:text-laiton-200"
          >
            Découvrir l&apos;offre Premium →
          </Link>
        </>
      )}
    </div>
  );
}
