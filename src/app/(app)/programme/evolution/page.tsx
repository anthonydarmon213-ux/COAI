import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { buildProfilIntelligence } from "@/lib/insight/profil-appris";
import { buildTimeline } from "@/lib/timeline/evenements";
import { InfoTooltip } from "@/components/ui/tooltip";
import { ProfilIntelligenceSection } from "@/components/programme/profil-intelligence";
import { trackServerEvent } from "@/lib/analytics/product-events";
import type { DecisionAdaptation, Pilier, StatutAdaptation } from "@prisma/client";
import { ShareProgressCardButton } from "@/components/suivi/share-progress-card-button";

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
  PROPOSEE: "En attente de ta confirmation",
  REJETEE: "Non retenue — tu as gardé ton programme actuel",
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

  const [adaptations, versionsParPilier, profilIntelligence, timeline] = await Promise.all([
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
    buildProfilIntelligence(user.id),
    buildTimeline(user.id),
  ]);

  // Phase 3, bloc NEAT — visite de cette page = ouverture de l'explication
  // "Ton mouvement quotidien compte aussi" affichée plus bas.
  trackServerEvent("neat_explanation_opened", user.id);

  const versionsGroupees = versionsParPilier.reduce<Record<Pilier, typeof versionsParPilier>>(
    (acc, v) => {
      acc[v.pilier] = [...(acc[v.pilier] ?? []), v];
      return acc;
    },
    { ENTRAINEMENT: [], NUTRITION: [], RECUPERATION: [] }
  );

  return (
    <div className="flex flex-col gap-10">
      <div className="animate-reveal flex flex-col gap-3 border-b border-acier/25 pb-7">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Ton évolution</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
          Ton programme évolue.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-400">
          Chaque ajustement de ton programme est expliqué ici — jamais de changement silencieux.
          COAI apprend de tes séances et de tes bilans pour faire évoluer ce qui doit l&apos;être,
          et garder le reste.
        </p>
      </div>

      <ProfilIntelligenceSection profil={profilIntelligence} />

      <div id="neat" className="flex flex-col gap-3 scroll-mt-8">
        <div className="flex items-center gap-2">
          <SectionLabel>Activité quotidienne</SectionLabel>
          <InfoTooltip text="Le NEAT correspond à toute l'activité réalisée en dehors de tes séances : marche, déplacements, escaliers, tâches quotidiennes et temps passé debout." />
        </div>
        <Card className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-white">Ton mouvement quotidien compte aussi</h2>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { lettre: "N", mot: "Non", sens: "pas lié à l'exercice" },
              { lettre: "E", mot: "Exercise", sens: "l'exercice structuré" },
              { lettre: "A", mot: "Activity", sens: "l'activité physique" },
              { lettre: "T", mot: "Thermogenesis", sens: "la dépense d'énergie" },
            ].map((item) => (
              <div key={item.lettre} className="flex flex-col gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <span className="font-editorial text-xl text-laiton-300">{item.lettre}</span>
                <span className="text-xs font-medium text-white">{item.mot}</span>
                <span className="text-[11px] leading-4 text-graphite-500">{item.sens}</span>
              </div>
            ))}
          </div>
          <p className="text-xs leading-5 text-graphite-500">
            NEAT = <em>Non-Exercise Activity Thermogenesis</em>, littéralement « la dépense d&apos;énergie
            liée à l&apos;activité physique qui n&apos;est pas de l&apos;exercice structuré ». En clair :
            tout ce qui fait bouger ton corps en dehors d&apos;une séance de sport.
          </p>

          <p className="text-sm leading-6 text-graphite-300">
            Le NEAT représente toute l&apos;activité physique que tu réalises en dehors de tes séances :
            marcher, prendre les escaliers, rester debout, faire le ménage, jardiner ou simplement te
            déplacer au cours de la journée.
          </p>
          <p className="text-sm leading-6 text-graphite-300">
            Ces petits mouvements s&apos;accumulent et peuvent jouer un rôle important dans ta dépense
            énergétique, ta santé et ta progression.
          </p>
          <p className="text-sm leading-6 text-graphite-300">
            COAI ne t&apos;impose pas automatiquement 10 000 pas par jour. Il apprend d&apos;abord ton
            niveau d&apos;activité habituel, puis te propose une évolution progressive adaptée à ton
            travail, ton emploi du temps et ta récupération.
          </p>
          <p className="text-sm leading-6 text-graphite-300">
            L&apos;objectif n&apos;est pas de brûler le plus de calories possible. L&apos;objectif est de
            bouger suffisamment, régulièrement et durablement, sans augmenter ta fatigue ni compromettre
            tes entraînements.
          </p>
          <p className="text-sm font-medium leading-6 text-graphite-100">
            Tes séances comptent. Tout ce que tu fais entre tes séances compte aussi.
          </p>
        </Card>
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
              {a.noteCoach && (
                <div className="rounded-xl border border-laiton-400/20 bg-laiton-400/[0.04] p-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-laiton-500">
                    Note de ton coach
                  </span>
                  <p className="mt-1 text-sm text-graphite-200">{a.noteCoach}</p>
                </div>
              )}
              <div className="mt-1 flex justify-end border-t border-white/[0.06] pt-3">
                <ShareProgressCardButton
                  imageUrl={`/api/programmes/adaptations/${a.id}/carte`}
                  filename={`coai-evolution-${a.pilier.toLowerCase()}.png`}
                  title="Mon coaching COAI évolue"
                />
              </div>
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
