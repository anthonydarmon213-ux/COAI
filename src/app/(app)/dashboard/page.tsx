import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { Gauge } from "@/components/ui/gauge";
import { CoachingVisioCta } from "@/components/suivi/coaching-visio-cta";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { PlanCard } from "@/components/dashboard/plan-card";
import { getEffectivePlan } from "@/lib/subscription/plan";
import type { Pilier } from "@prisma/client";

const PILIER_LABELS: Record<Pilier, string> = {
  ENTRAINEMENT: "Entraînement",
  NUTRITION: "Nutrition",
  RECUPERATION: "Récupération",
};

// Le pourcentage de chaque jauge reflète l'état du programme pour ce pilier
// (aucune donnée physiologique type fréquence cardiaque/HRV n'est collectée
// en continu dans l'app — pas de "score de récupération" inventé) :
// 0% = jamais généré, 50% = en attente de relecture coach, 100% = validé.
function statutVersPourcent(statut: "VALIDE" | "EN_ATTENTE" | null): {
  percent: number;
  sublabel: string;
} {
  if (statut === "VALIDE") return { percent: 100, sublabel: "Programme actif" };
  if (statut === "EN_ATTENTE") return { percent: 50, sublabel: "En cours de relecture" };
  return { percent: 0, sublabel: "Pas encore généré" };
}

export default async function DashboardPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const piliers: Pilier[] = ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"];
  const plan = getEffectivePlan(user.subscription);

  const [derniereSeance, derniereMesure, dernieresGenerations] = await Promise.all([
    prisma.seanceLog.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    prisma.mesure.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    Promise.all(
      piliers.map((pilier) =>
        prisma.programmeGenerated.findFirst({
          where: { userId: user.id, pilier },
          orderBy: { generatedAt: "desc" },
        })
      )
    ),
  ]);

  const programmeCount = dernieresGenerations.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-acier/25 pb-7">
        <SectionLabel>Vue d&apos;ensemble</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
          {user.prenom ? `Bonjour ${user.prenom}.` : "Votre progression commence ici."}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-400">COAI réunit vos programmes, votre suivi et les recommandations validées par votre coach Anthony.</p>
      </div>

      <OnboardingChecklist hasProfile={!!user.profile} hasProgramme={programmeCount > 0} />

      <PlanCard plan={plan} />

      <div className="flex flex-col gap-3">
        <SectionLabel>Vue du jour</SectionLabel>
        <Card className="flex flex-wrap justify-around gap-8 py-8">
          {piliers.map((pilier, i) => {
            const { percent, sublabel } = statutVersPourcent(
              dernieresGenerations[i]?.statut ?? null
            );
            return (
              <Gauge
                key={pilier}
                label={PILIER_LABELS[pilier]}
                percent={percent}
                sublabel={sublabel}
              />
            );
          })}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="min-h-32">
          <h2 className="font-mono text-xs uppercase tracking-wider text-graphite-400">
            Dernière séance
          </h2>
          <p className="mt-5 font-editorial text-2xl text-graphite-50">
            {derniereSeance ? derniereSeance.date.toISOString().slice(0, 10) : "Aucune séance loguée"}
          </p>
        </Card>
        <Card className="min-h-32">
          <h2 className="font-mono text-xs uppercase tracking-wider text-graphite-400">
            Dernière mesure
          </h2>
          <p className="mt-5 font-editorial text-2xl text-graphite-50">
            {derniereMesure?.poidsKg ? `${derniereMesure.poidsKg} kg` : "Aucune mesure enregistrée"}
          </p>
        </Card>
      </div>
      <a href="/programme" className="group flex items-center justify-between rounded-2xl border border-laiton-400/20 bg-laiton-400/[0.06] px-6 py-5 text-sm text-laiton-300 transition hover:bg-laiton-400/[0.1]">
        <span>Voir mon profil et mon programme personnalisé</span><span className="transition group-hover:translate-x-1">→</span>
      </a>
      <CoachingVisioCta plan={plan} />
    </div>
  );
}
