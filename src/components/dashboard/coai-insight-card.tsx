import type { CoaiInsight } from "@/lib/insight/coai-insight";

const TON_ACCENT: Record<CoaiInsight["ton"], string> = {
  neutral: "border-white/[0.08]",
  success: "border-laiton-400/25",
  warning: "border-amber-500/25",
};

// Carte premium "COAI Insight" (vision produit 11/08/2026) — l'endroit où
// le dashboard montre concrètement que COAI apprend de l'utilisateur,
// plutôt que de rester un simple générateur de programme. Le texte vient
// toujours de src/lib/insight/coai-insight.ts, jamais inventé ici.
export function CoaiInsightCard({ insight }: { insight: CoaiInsight }) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border bg-gradient-to-br from-white/[0.04] to-transparent p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${TON_ACCENT[insight.ton]}`}
    >
      <span className="coai-gradient-text font-mono text-xs font-semibold uppercase tracking-[0.16em]">
        COAI Insight
      </span>
      <p className="text-sm leading-6 text-graphite-100">{insight.texte}</p>
    </div>
  );
}
