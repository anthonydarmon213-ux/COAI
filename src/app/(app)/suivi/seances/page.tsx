import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SeanceForm } from "@/components/suivi/seance-form";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { Badge } from "@/components/ui/badge";

const DOULEUR_LABEL: Record<string, string> = {
  LEGERE: "Douleur légère",
  IMPORTANTE: "Douleur importante",
};

export default async function SeancesPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const seances = await prisma.seanceLog.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionLabel>Suivi</SectionLabel>
        <h1 className="text-2xl font-semibold">Journal de séances</h1>
      </div>
      <SeanceForm />
      <div className="flex flex-col gap-2">
        {seances.map((s) => {
          const exercices = Array.isArray(s.exercices)
            ? (s.exercices as { nom?: string; chargeKg?: number }[])
            : [];
          return (
            <Card key={s.id} className="flex flex-col gap-1.5 p-3 text-sm">
              <div>
                <span className="font-mono text-laiton-400">{s.date.toISOString().slice(0, 10)}</span>
                {exercices.map((ex, i) => (
                  <span key={i}>
                    {" — "}
                    {ex.nom}
                    {typeof ex.chargeKg === "number" ? ` (${ex.chargeKg} kg)` : ""}
                  </span>
                ))}
                {s.ressenti ? ` — ${s.ressenti}` : ""}
              </div>
              {(s.difficulte || s.energie || (s.douleur && s.douleur !== "AUCUNE")) && (
                <div className="flex flex-wrap gap-1.5">
                  {s.difficulte && <Badge tone="neutral">Difficulté {s.difficulte}/5</Badge>}
                  {s.energie && <Badge tone="neutral">Énergie {s.energie}/5</Badge>}
                  {s.douleur && s.douleur !== "AUCUNE" && (
                    <Badge tone={s.douleur === "IMPORTANTE" ? "danger" : "warning"}>
                      {DOULEUR_LABEL[s.douleur]}
                      {s.douleurZone ? ` — ${s.douleurZone}` : ""}
                    </Badge>
                  )}
                </div>
              )}
              {s.notes && <p className="text-graphite-400">{s.notes}</p>}
            </Card>
          );
        })}
        {seances.length === 0 && <p className="text-graphite-400">Aucune séance loguée.</p>}
      </div>
    </div>
  );
}
