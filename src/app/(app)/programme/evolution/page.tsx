import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { buildProfilAppris } from "@/lib/insight/profil-appris";
import { buildTimeline } from "@/lib/timeline/evenements";
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

  const [adaptations, versionsParPilier, profilAppris, timeline] = await Promise.all([
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
    buildProfilAppris(user.id),
    buildTimeline(user.id),
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

      <div className="flex flex-col gap-4">
        <SectionLabel>Ce que COAI apprend sur toi</SectionLabel>
        {profilAppris.length === 0 ? (
          <Card className="text-sm text-graphite-400">COAI apprend encore à te connaître.</Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {profilAppris.map((item) => (
              <Card key={item.label} className="flex flex-col gap-1 p-4">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-white">{item.valeur}</span>
              </Card>
            ))}
          </div>
        )}
      </div>

      {timeline.length > 0 && (
        <div className="flex flex-col gap-4">
          <SectionLabel>Mon évolution</SectionLabel>
          <div className="flex flex-col gap-0">
            {timeline.map((e, i) => (
              <div key={i} className="flex gap-4 border-l border-white/[0.08] pb-5 pl-5 last:pb-0">
                <div className="relative">
                  <span className="absolute -left-[1.375rem] top-1 h-2 w-2 rounded-full bg-laiton-400" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-graphite-500">
                    {e.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                  </span>
                  <span className="text-sm font-medium text-white">{e.titre}</span>
                  {e.detail && <span className="text-xs text-graphite-400">{e.detail}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <div className="flex flex-col gap-2">
                  {changements.map((c, i) => (
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                      <span className="text-sm font-medium text-white">{c.cible}</span>
                      {c.avant != null && c.apres != null && (
                        <div className="mt-1 flex items-center gap-2 font-mono text-sm">
                          <span className="text-graphite-400">{c.avant}</span>
                          <span className="text-laiton-400">→</span>
                          <span className="font-semibold text-laiton-200">{c.apres}</span>
                        </div>
                      )}
                      <p className="mt-1 text-xs leading-5 text-graphite-500">
                        <span className="text-graphite-600">Pourquoi ? </span>
                        {c.raison}
                      </p>
                    </div>
                  ))}
                </div>
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
