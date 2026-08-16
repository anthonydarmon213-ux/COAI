import { getCurrentAppUser } from "@/lib/auth/server";
import { getEffectivePlan } from "@/lib/subscription/plan";
import { AskCoach } from "@/components/coach/ask-coach";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { buildProfilIntelligence } from "@/lib/insight/profil-appris";
import { CoachMemoryStatus } from "@/components/coach/coach-memory-status";
import { getCoachQuotaState } from "@/lib/subscription/coach-quota";
import { CoachingVisioCta } from "@/components/suivi/coaching-visio-cta";

export default async function CoachPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const plan = getEffectivePlan(user.subscription);
  const intelligence = await buildProfilIntelligence(user.id);
  const quota = getCoachQuotaState(user.coachQuestionsUsed, user.coachQuestionsResetAt);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-acier/25 pb-7">
        <SectionLabel>Coach IA</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
          Posez votre question.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-400">
          Réponse immédiate par l&apos;IA, dans l&apos;esprit de la méthode d&apos;Anthony
          Darmon. Pour un suivi médical ou un ajustement personnalisé approfondi, un échange
          direct avec ton coach reste la meilleure option.
        </p>
        {plan === "GRATUIT" && <Badge tone="warning">{quota.remaining} question(s) restante(s) sur 4</Badge>}
        <CoachMemoryStatus progression={intelligence.progression} observations={intelligence.items.length} tendances={intelligence.tendances.length} />
      </div>

      <AskCoach initialQuotaRemaining={plan === "GRATUIT" ? quota.remaining : null} />

      <div className="flex flex-col gap-4 border-t border-acier/25 pt-8">
        <div className="flex flex-col gap-2">
          <SectionLabel>Coach humain</SectionLabel>
          <h2 className="font-editorial text-2xl font-normal tracking-tight sm:text-3xl">
            Un vrai coach, quand tu en as besoin.
          </h2>
        </div>
        <CoachingVisioCta plan={plan} />
      </div>
    </div>
  );
}
