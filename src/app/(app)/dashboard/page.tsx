import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { CoachingVisioCta } from "@/components/suivi/coaching-visio-cta";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";

export default async function DashboardPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const [derniereSeance, derniereMesure, programmeCount] = await Promise.all([
    prisma.seanceLog.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    prisma.mesure.findFirst({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    prisma.programmeGenerated.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionLabel>Vue d&apos;ensemble</SectionLabel>
        <h1 className="text-2xl font-semibold">Tableau de bord</h1>
      </div>

      <OnboardingChecklist hasProfile={!!user.profile} hasProgramme={programmeCount > 0} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <h2 className="font-mono text-xs uppercase tracking-wider text-graphite-400">
            Dernière séance
          </h2>
          <p className="mt-1 text-laiton-400">
            {derniereSeance ? derniereSeance.date.toISOString().slice(0, 10) : "Aucune séance loguée"}
          </p>
        </Card>
        <Card>
          <h2 className="font-mono text-xs uppercase tracking-wider text-graphite-400">
            Dernière mesure
          </h2>
          <p className="mt-1 text-laiton-400">
            {derniereMesure?.poidsKg ? `${derniereMesure.poidsKg} kg` : "Aucune mesure enregistrée"}
          </p>
        </Card>
      </div>
      <a href="/programme" className="text-laiton-400 underline">
        Voir mon programme
      </a>
      <CoachingVisioCta />
    </div>
  );
}
