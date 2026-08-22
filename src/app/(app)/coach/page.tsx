import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { getEffectivePlan } from "@/lib/subscription/plan";
import { AskCoach } from "@/components/coach/ask-coach";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { buildProfilIntelligence } from "@/lib/insight/profil-appris";
import { CoachMemoryStatus } from "@/components/coach/coach-memory-status";
import { getCoachQuotaState } from "@/lib/subscription/coach-quota";
import { CoachingVisioCta } from "@/components/suivi/coaching-visio-cta";
import { DebriefSemaineCard } from "@/components/coach/debrief-semaine-card";
import { getDebriefSemaine } from "@/lib/insight/debrief-semaine";
import { prisma } from "@/lib/db/client";

// Hub de suivi (21/08/2026, demande Anthony) — la page ne se limite plus à
// un champ de question : débrief hebdomadaire calculé sur données réelles,
// conversation en bulles avec le Coach IA, et rappel de la prochaine
// échéance. Le chat s'adresse au Coach IA (le seul canal réellement
// implémenté) ; le contact avec un coach humain passe toujours par
// CoachingVisioCta, jamais par une boîte de réception qui n'enverrait
// nulle part — aucun modèle de messagerie n'existe en base.
function debutDeSemaine(date: Date): Date {
  const d = new Date(date);
  const jour = d.getDay();
  d.setDate(d.getDate() - (jour === 0 ? 6 : jour - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function CoachPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const plan = getEffectivePlan(user.subscription);
  const [intelligence, debrief, checkinSemaine] = await Promise.all([
    buildProfilIntelligence(user.id),
    getDebriefSemaine(user.id),
    prisma.weeklyCheckin.findUnique({
      where: { userId_semaineDebut: { userId: user.id, semaineDebut: debutDeSemaine(new Date()) } },
      select: { id: true },
    }),
  ]);
  const quota = getCoachQuotaState(user.coachQuestionsUsed, user.coachQuestionsResetAt);

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-reveal flex flex-col gap-2">
        <SectionLabel>Mon Coach</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
          Ton suivi, en un seul endroit.
        </h1>
        {plan === "GRATUIT" && <Badge tone="warning">{quota.remaining} question(s) restante(s) sur 4</Badge>}
      </div>

      <DebriefSemaineCard debrief={debrief} />

      <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
        <div className="lg:col-span-2">
          <AskCoach initialQuotaRemaining={plan === "GRATUIT" ? quota.remaining : null} />
        </div>

        <div className="flex flex-col gap-4">
          {/* Prochaines étapes — l'état affiché reflète le vrai check-in
              hebdo en base, jamais une date décorative. */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">Prochaine étape</p>
            {checkinSemaine ? (
              <>
                <h2 className="mt-2 text-lg font-semibold text-white">Check-in de la semaine fait ✓</h2>
                <p className="mt-1.5 text-xs leading-5 text-graphite-400">
                  Prochain bilan hebdomadaire lundi prochain. D&apos;ici là, tes check-ins quotidiens continuent d&apos;affiner ton programme.
                </p>
              </>
            ) : (
              <>
                <h2 className="mt-2 text-lg font-semibold text-white">Ton bilan de la semaine t&apos;attend.</h2>
                <p className="mt-1.5 text-xs leading-5 text-graphite-400">
                  60 secondes : sommeil, énergie, séances réalisées. C&apos;est ce qui permet d&apos;ajuster la semaine suivante.
                </p>
                <Link
                  href="/dashboard#check-in-du-jour"
                  className="mt-3 inline-flex rounded-full border border-laiton-400/35 bg-laiton-400/10 px-4 py-2 text-xs font-semibold text-laiton-200 transition hover:bg-laiton-400/20"
                >
                  Faire mon bilan →
                </Link>
              </>
            )}
          </section>

          <CoachMemoryStatus
            progression={intelligence.progression}
            observations={intelligence.items.length}
            tendances={intelligence.tendances.length}
          />

          <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">Coach humain</p>
            <h2 className="mt-2 text-lg font-semibold text-white">Un vrai coach, quand tu en as besoin.</h2>
            <div className="mt-3">
              <CoachingVisioCta plan={plan} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
