import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { RegenerateButton } from "@/components/programme/regenerate-button";
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
        <h1 className="text-2xl font-semibold">Mon programme</h1>
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
          <section key={pilier} className="rounded-lg border border-graphite-800 p-4">
            <h2 className="mb-2 text-lg font-medium text-laiton-400">{LABELS[pilier]}</h2>
            {programme ? (
              <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-graphite-200">
                {JSON.stringify(programme.contenu, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-graphite-400">Pas encore généré.</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
