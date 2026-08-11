import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import type { DecisionAdaptation, Pilier, StatutAdaptation } from "@prisma/client";

const PILIER_LABEL: Record<Pilier, string> = {
  ENTRAINEMENT: "Entraînement",
  NUTRITION: "Alimentation",
  RECUPERATION: "Récupération",
};

const DECISION_LABEL: Record<DecisionAdaptation, { label: string; tone: "neutral" | "success" | "warning" }> = {
  GARDER: { label: "Programme maintenu", tone: "neutral" },
  PROGRESSER: { label: "Progression", tone: "success" },
  REDUIRE: { label: "Volume réduit", tone: "warning" },
  MODIFIER: { label: "Modification", tone: "success" },
  ADAPTER: { label: "Adaptation ponctuelle", tone: "success" },
};

const STATUT_LABEL: Record<StatutAdaptation, string> = {
  APPLIQUEE: "Appliquée",
  EN_ATTENTE: "En attente de validation coach",
  VALIDEE: "Validée par ton coach",
  MODIFIEE: "Ajustée par ton coach",
};

type Changement = { cible: string; avant: string | number | null; apres: string | number | null; raison: string };

// "Ton programme évolue" (11/08/2026, cœur de la vision produit) — trace
// explicite de chaque adaptation avec sa raison, jamais un changement
// silencieux. Complète l'historique de versions (V1, V2...) déjà visible
// sur chaque page de pilier.
export default async function EvolutionPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const [adaptations, versionsParPilier] = await Promise.all([
    prisma.programmeAdaptation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.programmeGenerated.findMany({
      where: { userId: user.id },
      orderBy: [{ pilier: "asc" }, { version: "desc" }],
      select: { id: true, pilier: true, version: true, generatedAt: true, statut: true },
    }),
  ]);

  const versionsGroupees = versionsParPilier.reduce<Record<Pilier, typeof versionsParPilier>>(
    (acc, v) => {
      acc[v.pilier] = [...(acc[v.pilier] ?? []), v];
      return acc;
    },
    { ENTRAINEMENT: [], NUTRITION: [], RECUPERATION: [] }
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2 border-b border-acier/25 pb-7">
        <SectionLabel>Ton évolution</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
          Ton programme évolue.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-400">
          Chaque ajustement de ton programme est expliqué ici — jamais de changement silencieux.
          COAI apprend de tes séances et de tes check-ins pour faire évoluer ce qui doit l&apos;être,
          et garder le reste.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {adaptations.length === 0 && (
          <Card className="text-sm text-graphite-400">
            Aucune adaptation pour le moment. Utilise «&nbsp;Analyser mon programme&nbsp;» depuis une
            page de ton programme une fois quelques séances loguées.
          </Card>
        )}
        {adaptations.map((a) => {
          const changements = Array.isArray(a.changements) ? (a.changements as unknown as Changement[]) : [];
          return (
            <Card key={a.id} className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge tone={DECISION_LABEL[a.decision].tone}>{DECISION_LABEL[a.decision].label}</Badge>
                  <span className="text-xs uppercase tracking-wider text-graphite-500">
                    {PILIER_LABEL[a.pilier]}
                  </span>
                </div>
                <span className="text-xs text-graphite-500">
                  {a.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              </div>
              <p className="text-sm leading-6 text-graphite-200">{a.resume}</p>
              {changements.length > 0 && (
                <ul className="flex flex-col gap-1 text-xs text-graphite-400">
                  {changements.map((c, i) => (
                    <li key={i}>
                      <span className="text-graphite-200">{c.cible}</span>
                      {c.avant != null && c.apres != null ? ` : ${c.avant} → ${c.apres}` : ""}
                      {" — "}
                      {c.raison}
                    </li>
                  ))}
                </ul>
              )}
              {a.statut !== "APPLIQUEE" && (
                <span className="text-xs text-laiton-300">{STATUT_LABEL[a.statut]}</span>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        <SectionLabel>Historique des versions</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {(Object.keys(PILIER_LABEL) as Pilier[]).map((pilier) => (
            <Card key={pilier} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-white">{PILIER_LABEL[pilier]}</h2>
              {versionsGroupees[pilier].length === 0 && (
                <p className="text-xs text-graphite-500">Pas encore généré.</p>
              )}
              <ul className="flex flex-col gap-1">
                {versionsGroupees[pilier].map((v) => (
                  <li key={v.id} className="flex items-center justify-between text-xs text-graphite-400">
                    <span className="text-graphite-200">V{v.version}</span>
                    <span>{v.generatedAt.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>

      <Link href="/programme" className="text-sm text-laiton-400 underline">
        ← Retour à ton programme
      </Link>
    </div>
  );
}
