"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ServiceDetailModal } from "@/components/marketing/service-detail-modal";
import type { CoaiInsight } from "@/lib/insight/coai-insight";
import type { ServiceRecommande } from "@/lib/dashboard/besoins-identifies";

const TON_ACCENT: Record<CoaiInsight["ton"], string> = {
  neutral: "border-white/[0.08]",
  success: "border-laiton-400/25",
  warning: "border-amber-500/25",
};

export type MissionDuJour = {
  kicker: string;
  title: string;
  description: string;
  href?: string;
  cta?: string;
};

// Carte guidée du dashboard (19/08/2026, demande Anthony : "un effet waouh
// à chaque connexion, être pédagogue, indiquer ce que doit faire la
// personne"). Contrairement à l'ancien état "Choisis maintenant ton niveau
// d'accompagnement" qui ne s'affichait que dans le cas précis "aucun
// programme", cette carte s'affiche à chaque visite, tout en haut du
// dashboard : une seule direction claire (mission), le COAI Insight déjà
// calculé (jamais de statistique inventée pour faire "waouh") mis en avant
// visuellement, puis — pour tout compte n'ayant débloqué ni Impulsion ni
// Transformation (`!hasAccess`) — un rappel du bon accompagnement.
export function AujourdhuiGuideCard({
  mission,
  insight,
  hasAccess,
  serviceRecommande,
}: {
  mission: MissionDuJour;
  insight: CoaiInsight;
  hasAccess: boolean;
  serviceRecommande: ServiceRecommande;
}) {
  const [modalOuvert, setModalOuvert] = useState(false);

  return (
    <section
      className={`animate-reveal relative overflow-hidden rounded-[1.75rem] border bg-gradient-to-br from-white/[0.045] to-transparent p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_28px_80px_-48px_rgba(0,0,0,0.75)] sm:p-8 ${TON_ACCENT[insight.ton]}`}
      aria-labelledby="aujourdhui-mission-title"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="flex-1">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">{mission.kicker}</p>
          <h2 id="aujourdhui-mission-title" className="mt-2 font-editorial text-2xl sm:text-3xl">
            {mission.title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-graphite-300">{mission.description}</p>
          {mission.href && (
            <Link href={mission.href} className="coai-rainbow-cta mt-5 inline-flex rounded-xl px-6 py-3 text-sm font-extrabold text-white">
              {mission.cta ?? "Continuer →"}
            </Link>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-5">
          <span className="coai-gradient-text font-mono text-xs font-semibold uppercase tracking-[0.16em]">COAI Insight</span>
          <p className="mt-2 text-sm leading-6 text-graphite-100">{insight.texte}</p>
        </div>
      </div>

      {!hasAccess && (
        <div className="mt-6 flex flex-col items-start gap-3 border-t border-white/[0.08] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-lg text-sm leading-6 text-graphite-300">
            Débloque le suivi complet — programme généré, adaptations continues, et un coach humain si tu en as besoin — pour transformer cette photo du jour en vraie progression.
          </p>
          <Button className="coai-rainbow-cta shrink-0 border-0 text-[#111216]" onClick={() => setModalOuvert(true)}>
            Débloquer mon accompagnement →
          </Button>
        </div>
      )}

      {modalOuvert && <ServiceDetailModal initialService={serviceRecommande} onClose={() => setModalOuvert(false)} />}
    </section>
  );
}
