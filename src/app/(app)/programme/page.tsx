import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import Link from "next/link";
import { RegenerateButton } from "@/components/programme/regenerate-button";
import { JsonView } from "@/components/programme/json-view";
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

      {!user.profile && (
        <p className="text-graphite-200">
          Aucun profil renseigné pour l&apos;instant — le programme généré reste générique.{" "}
          <Link href="/compte/profil" className="text-laiton-400 underline">
            Renseigner mon profil
          </Link>
          , puis clique sur « Régénérer mon programme ».
        </p>
      )}

      {piliers.map((pilier, i) => {
        const programme = derniersProgrammes[i];
        return (
          <Card key={pilier}>
            <SectionLabel>Pilier — {LABELS[pilier]}</SectionLabel>
            {programme ? (
              <div className="mt-2">
                <JsonView data={programme.contenu} />
              </div>
            ) : (
              <p className="mt-2 text-sm text-graphite-400">Pas encore généré.</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
