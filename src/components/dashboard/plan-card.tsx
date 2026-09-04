import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { PLAN_LABELS, type EffectivePlan } from "@/lib/subscription/plan";
import { PLAN_FEATURES } from "@/lib/subscription/plan-features";

export function PlanCard({ plan }: { plan: EffectivePlan }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Votre accompagnement</SectionLabel>
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-semibold text-graphite-50">{PLAN_LABELS[plan]}</span>
            {plan === "PASS_IA" && <Badge tone="neutral">Sans engagement</Badge>}
          </div>
          <Link
            href="/pricing"
            className="shrink-0 whitespace-nowrap text-sm font-medium text-laiton-400 underline hover:text-laiton-300"
          >
            {plan === "PREMIUM" ? "Voir les accompagnements" : "Changer d'offre →"}
          </Link>
        </div>
        <ul className="flex flex-col gap-1.5">
          {PLAN_FEATURES[plan].map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-graphite-300">
              <span className="mt-0.5 text-laiton-400">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
