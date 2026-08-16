import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { TestMaxiForm } from "@/components/suivi/test-maxi-form";
import { Sparkline } from "@/components/suivi/sparkline";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { ShareProgressCardButton } from "@/components/suivi/share-progress-card-button";
import {
  LABEL_PAR_EXERCICE,
  ORDRE_EXERCICES,
  ORDRE_QUALITES,
  QUALITE_PAR_EXERCICE,
} from "@/lib/tests-maxi/labels";

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
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Suivi</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Tests physiques.</h1>
        <p className="text-sm text-graphite-400">
          Force, vitesse, puissance, souplesse, équilibre, endurance — enregistre tes résultats
          pour voir ta progression sur les qualités physiques de référence.
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
        <div className="flex flex-col gap-6">
          <SectionLabel>Évolution</SectionLabel>
          {ORDRE_QUALITES.map((qualite) => {
            const graphiquesQualite = graphiques.filter(
              (g) => QUALITE_PAR_EXERCICE[g.exercice] === qualite
            );
            if (graphiquesQualite.length === 0) return null;
            return (
              <div key={qualite} className="flex flex-col gap-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-graphite-500">
                  {qualite}
                </span>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {graphiquesQualite.map((g) => (
                    <Sparkline
                      key={g.exercice}
                      label={LABEL_PAR_EXERCICE[g.exercice]}
                      unite={g.unite}
                      points={g.points}
                    />
                  ))}
                </div>
              </div>
            );
          })}
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
            <ShareProgressCardButton
              imageUrl={`/api/tests-maxi/${t.id}/carte`}
              filename={`coai-record-${t.exercice.toLowerCase()}.png`}
              title={`Mon record COAI — ${LABEL_PAR_EXERCICE[t.exercice]}`}
            />
          </Card>
        ))}
        {testsMaxi.length === 0 && (
          <p className="text-graphite-400">Aucun test maxi enregistré pour le moment.</p>
        )}
      </div>
    </div>
  );
}
