import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { RepasForm } from "@/components/suivi/repas-form";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import type { StatutRepas } from "@prisma/client";

const STATUT_LABELS: Record<StatutRepas, { label: string; tone: "success" | "warning" | "danger" }> = {
  COMME_PREVU: { label: "Comme prévu", tone: "success" },
  PETIT_ECART: { label: "Petit écart", tone: "warning" },
  GROS_ECART: { label: "Gros écart", tone: "danger" },
};

export default async function AlimentationSuiviPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const repasLogs = await prisma.repasLog.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Suivi</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Journal nutrition.</h1>
        <p className="text-sm text-graphite-400">
          Un check-in rapide par jour, pas un journal alimentaire complet à remplir à chaque repas.
        </p>
      </div>
      <RepasForm />
      <div className="flex flex-col gap-2">
        {repasLogs.map((r) => {
          const { label, tone } = STATUT_LABELS[r.statut];
          return (
            <Card key={r.id} className="flex items-center gap-3 p-3 text-sm">
              <span className="font-mono text-laiton-400">{r.date.toISOString().slice(0, 10)}</span>
              <Badge tone={tone}>{label}</Badge>
              {r.notes && <span className="text-graphite-300">{r.notes}</span>}
            </Card>
          );
        })}
        {repasLogs.length === 0 && <p className="text-graphite-400">Aucun check-in pour l&apos;instant.</p>}
      </div>
    </div>
  );
}
