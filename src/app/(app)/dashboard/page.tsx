import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { Gauge } from "@/components/ui/gauge";
import { CoachingVisioCta } from "@/components/suivi/coaching-visio-cta";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionLabel>Vue d&apos;ensemble</SectionLabel>
        <h1 className="text-2xl font-semibold">
          {user.prenom ? `Bonjour ${user.prenom}` : "Tableau de bord"}
        </h1>
      </div>

      <OnboardingChecklist hasProfile={!!user.profile} hasProgramme={programmeCount > 0} />

      <div className="flex flex-col gap-3">
        <SectionLabel>Vue du jour</SectionLabel>
        <Card className="flex flex-wrap justify-around gap-6 py-6">
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
