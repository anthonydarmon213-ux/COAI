import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import Link from "next/link";
import { RegenerateButton } from "@/components/programme/regenerate-button";
import { JsonView } from "@/components/programme/json-view";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const [derniersValides, dernieresGenerations] = await Promise.all([
    Promise.all(
      piliers.map((pilier) =>
        prisma.programmeGenerated.findFirst({
          where: { userId: user.id, pilier, statut: "VALIDE" },
          orderBy: { generatedAt: "desc" },
        })
      )
    ),
    Promise.all(
      piliers.map((pilier) =>
        prisma.programmeGenerated.findFirst({
          where: { userId: user.id, pilier },
          orderBy: { generatedAt: "desc" },
        })
      )
    ),
  ]);

  const hasExisting = dernieresGenerations.some(Boolean);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <SectionLabel>Coaching</SectionLabel>
          <h1 className="text-2xl font-semibold">Mon programme</h1>
        </div>
        <RegenerateButton hasExisting={hasExisting} />
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
        const valide = derniersValides[i];
        const dernier = dernieresGenerations[i];
        const enAttente = dernier && dernier.statut === "EN_ATTENTE";

        return (
          <Card key={pilier} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionLabel>Pilier — {LABELS[pilier]}</SectionLabel>
              {valide && <Badge tone="success">Généré par l&apos;IA · Supervisé par Anthony Darmon</Badge>}
            </div>

            {enAttente && (
              <p className="text-sm text-laiton-400">
                Un nouveau programme est en cours de relecture par ton coach — il apparaîtra
                ici une fois validé.
              </p>
            )}

            {valide ? (
              <JsonView data={valide.contenu} />
            ) : (
              <p className="text-sm text-graphite-400">
                {enAttente ? "Aucun programme validé pour l'instant." : "Pas encore généré."}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
