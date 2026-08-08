import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { PLAN_LABELS, type EffectivePlan } from "@/lib/subscription/plan";

const DESCRIPTIONS: Record<EffectivePlan, string> = {
  GRATUIT: "Journal de séances, suivi des mesures et coach IA (4 questions/mois).",
  STANDARD:
    "Programme personnalisé généré par IA et validé par un vrai coach, suivi de progression, streaming, assistant WhatsApp.",
  PREMIUM: "Tous les avantages Premium, en illimité.",
};

export function PlanCard({ plan }: { plan: EffectivePlan }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Votre formule</SectionLabel>
      <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-semibold text-graphite-50">{PLAN_LABELS[plan]}</span>
            {plan === "GRATUIT" && <Badge tone="neutral">Sans engagement</Badge>}
          </div>
          <p className="max-w-lg text-sm text-graphite-400">{DESCRIPTIONS[plan]}</p>
        </div>
        <Link
          href="/pricing"
          className="shrink-0 whitespace-nowrap text-sm font-medium text-laiton-400 underline hover:text-laiton-300"
        >
          {plan === "PREMIUM" ? "Voir les formules" : "Changer d'offre →"}
        </Link>
      </Card>
    </div>
  );
}
