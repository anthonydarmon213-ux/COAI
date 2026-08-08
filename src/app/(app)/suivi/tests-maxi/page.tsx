import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { TestMaxiForm } from "@/components/suivi/test-maxi-form";
import { Sparkline } from "@/components/suivi/sparkline";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import type { ExerciceMaxi } from "@prisma/client";

const LABEL_PAR_EXERCICE: Record<ExerciceMaxi, string> = {
  DEVELOPPE_COUCHE: "Développé couché",
  SQUAT: "Squat",
  SOULEVE_DE_TERRE: "Soulevé de terre",
  TRACTION: "Traction",
};
const ORDRE_EXERCICES: ExerciceMaxi[] = ["DEVELOPPE_COUCHE", "SQUAT", "SOULEVE_DE_TERRE", "TRACTION"];

export default async function TestsMaxiPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const testsMaxi = await prisma.testMaxi.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
  });

  const graphiques = ORDRE_EXERCICES.map((exercice) => {
    const entrees = testsMaxi.filter((t) => t.exercice === exercice);
    return {
      exercice,
      unite: entrees[0]?.unite ?? "kg",
      points: entrees.map((t) => t.valeur),
    };
  }).filter((g) => g.points.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionLabel>Suivi</SectionLabel>
        <h1 className="text-2xl font-semibold">Tests maxi</h1>
        <p className="text-sm text-graphite-400">
          Développé couché, squat, soulevé de terre, traction — enregistre ta charge maxi pour
          voir ta progression sur les mouvements de référence.
        </p>
      </div>

      <TestMaxiForm />

      {graphiques.length > 0 && (
        <div className="flex flex-col gap-3">
          <SectionLabel>Évolution</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {graphiques.map((g) => (
              <Sparkline
                key={g.exercice}
                label={LABEL_PAR_EXERCICE[g.exercice]}
                unite={g.unite}
                points={g.points}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <SectionLabel>Historique</SectionLabel>
        {[...testsMaxi].reverse().map((t) => (
          <Card key={t.id} className="flex items-center gap-3 p-3 text-sm">
            <span className="font-mono text-laiton-400">{t.date.toISOString().slice(0, 10)}</span>
            <span className="text-graphite-300">
              {LABEL_PAR_EXERCICE[t.exercice]} — {t.valeur} {t.unite}
              {t.notes ? ` · ${t.notes}` : ""}
            </span>
          </Card>
        ))}
        {testsMaxi.length === 0 && (
          <p className="text-graphite-400">Aucun test maxi enregistré pour le moment.</p>
        )}
      </div>
    </div>
  );
}
