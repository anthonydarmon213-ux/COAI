import { getCurrentAppUser } from "@/lib/auth/server";
import { getEffectivePlan, hasCoachIaAccess } from "@/lib/subscription/plan";
import { AskCoach } from "@/components/coach/ask-coach";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { buildProfilIntelligence } from "@/lib/insight/profil-appris";
import { CoachMemoryStatus } from "@/components/coach/coach-memory-status";
import { getCoachQuotaState } from "@/lib/subscription/coach-quota";
import { Card } from "@/components/ui/card";
import { ImpulsionCheckoutButton } from "@/components/programme/one-shot-programme-button";

export default async function CoachPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const plan = getEffectivePlan(user.subscription);
  const coachIaActif = hasCoachIaAccess(user.subscription);
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
        {coachIaActif && plan === "GRATUIT" && <Badge tone="warning">{quota.remaining} question(s) restante(s) sur 4</Badge>}
        <CoachMemoryStatus progression={intelligence.progression} observations={intelligence.items.length} tendances={intelligence.tendances.length} />
      </div>

      {coachIaActif ? (
        <AskCoach initialQuotaRemaining={plan === "GRATUIT" ? quota.remaining : null} />
      ) : (
        <Card className="mx-auto flex w-full max-w-xl flex-col gap-4 text-center">
          <h2 className="font-editorial text-3xl">Ton coach, disponible quand tu en as besoin.</h2>
          <p className="text-sm leading-6 text-graphite-300">
            Active le suivi et les questions Coach IA pour 9€/mois. Sans engagement.
          </p>
          <ImpulsionCheckoutButton offer="COACH" label="Activer le Coach IA — 9€/mois" />
        </Card>
      )}
    </div>
  );
}
