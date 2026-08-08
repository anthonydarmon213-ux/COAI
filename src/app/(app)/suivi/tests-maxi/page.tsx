import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { TestMaxiForm } from "@/components/suivi/test-maxi-form";
import { Sparkline } from "@/components/suivi/sparkline";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { LABEL_PAR_EXERCICE, ORDRE_EXERCICES } from "@/lib/tests-maxi/labels";

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

      <Card className="flex flex-col items-start gap-2 border-laiton-400/30">
        <Badge tone="warning">Sécurité</Badge>
        <p className="text-sm text-graphite-300">
          Pour un test maxi en charge libre (développé couché, squat, soulevé de terre), veille à
          être accompagné par un coach pour t&apos;assurer. Pas de coach disponible ? Privilégie
          les machines guidées. Pas de machine non plus ? Teste plutôt au poids du corps (max
          pompes, max tractions, max squat pistol...).
        </p>
      </Card>

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
          <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
            <div>
              <span className="font-mono text-laiton-400">{t.date.toISOString().slice(0, 10)}</span>
              <span className="text-graphite-300">
                {" "}
                — {LABEL_PAR_EXERCICE[t.exercice]} — {t.valeur} {t.unite}
                {t.notes ? ` · ${t.notes}` : ""}
              </span>
            </div>
            <a
              href={`/api/tests-maxi/${t.id}/carte`}
              download={`coai-record-${t.exercice.toLowerCase()}.png`}
              className="shrink-0 rounded-lg border border-laiton-400/30 px-3 py-1.5 text-xs font-medium text-laiton-300 transition hover:border-laiton-400/60 hover:text-laiton-200"
            >
              Partager →
            </a>
          </Card>
        ))}
        {testsMaxi.length === 0 && (
          <p className="text-graphite-400">Aucun test maxi enregistré pour le moment.</p>
        )}
      </div>
    </div>
  );
}
