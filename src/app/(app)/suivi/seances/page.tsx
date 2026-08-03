import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SeanceForm } from "@/components/suivi/seance-form";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

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
        {seances.map((s) => (
          <Card key={s.id} className="p-3 text-sm">
            <span className="font-mono text-laiton-400">{s.date.toISOString().slice(0, 10)}</span>
            {s.ressenti ? ` — ${s.ressenti}` : ""}
          </Card>
        ))}
        {seances.length === 0 && <p className="text-graphite-400">Aucune séance loguée.</p>}
      </div>
    </div>
  );
}
