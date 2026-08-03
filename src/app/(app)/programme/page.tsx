import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { RegenerateButton } from "@/components/programme/regenerate-button";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import type { Pilier } from "@prisma/client";

const LABELS: Record<Pilier, string> = {
  ENTRAINEMENT: "Entraînement",
  NUTRITION: "Nutrition",
  RECUPERATION: "Récupération",
};

export default async function ProgrammePage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const piliers: Pilier[] = ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"];
  const derniersProgrammes = await Promise.all(
    piliers.map((pilier) =>
      prisma.programmeGenerated.findFirst({
        where: { userId: user.id, pilier },
        orderBy: { generatedAt: "desc" },
      })
    )
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <SectionLabel>Coaching</SectionLabel>
          <h1 className="text-2xl font-semibold">Mon programme</h1>
        </div>
        <RegenerateButton />
      </div>

      {derniersProgrammes.every((p) => !p) && (
        <p className="text-graphite-200">
          Aucun programme généré pour le moment. Complète ton profil puis clique sur
          « Régénérer mon programme ».
        </p>
      )}

      {piliers.map((pilier, i) => {
        const programme = derniersProgrammes[i];
        return (
          <Card key={pilier}>
            <SectionLabel>Pilier — {LABELS[pilier]}</SectionLabel>
            {programme ? (
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-sm text-graphite-200">
                {JSON.stringify(programme.contenu, null, 2)}
              </pre>
            ) : (
              <p className="mt-2 text-sm text-graphite-400">Pas encore généré.</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
