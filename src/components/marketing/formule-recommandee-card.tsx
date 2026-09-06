"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ServiceDetailModal } from "@/components/marketing/service-detail-modal";
import { MembreFondateurBadge } from "@/components/marketing/membre-fondateur-badge";
import { TIER_BY_SERVICE, type ServiceKey } from "@/lib/pricing/tiers";

// Recommandation de formule sur l'écran de résultat du diagnostic public
// (19/08/2026, demande Anthony : "proposer une solution au prospect...
// en passant par les plusieurs formules si besoin"). Ouvre ServiceDetailModal
// — déjà utilisé côté dashboard (BesoinsIdentifiesCard, MaFormuleCard) —
// jamais dupliqué : mêmes prix, mêmes fonctionnalités, même geste d'achat.
// SubscribeButton (à l'intérieur du modal) gère déjà lui-même le cas d'un
// visiteur non connecté (redirection vers /sign-up avec le bon plan), donc
// ce composant fonctionne à l'identique avant ou après inscription.
export function FormuleRecommandeeCard({
  recommandation,
}: {
  recommandation: { service: ServiceKey; label: string; raison: string };
}) {
  const [ouvert, setOuvert] = useState(false);
  const tier = TIER_BY_SERVICE[recommandation.service];
  const ctaLabel = tier.sessions
    ? `Découvrir ${tier.nom}`
    : tier.trial
      ? "Commencer mes 7 jours d'essai"
      : `Choisir ${tier.nom}`;

  return (
    <section className="relative w-full overflow-hidden rounded-[2rem] border border-laiton-300/45 bg-[radial-gradient(circle_at_90%_0%,rgba(56,189,248,.16),transparent_22rem),radial-gradient(circle_at_0%_100%,rgba(201,162,98,.14),transparent_24rem),#0e1215] p-6 text-left shadow-[0_36px_100px_-45px_rgba(0,0,0,.95),inset_0_1px_0_rgba(255,255,255,.08)] sm:p-8" aria-labelledby="formule-recommandee-title">
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-laiton-200 to-cyan-300" aria-hidden="true" />
      <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-laiton-300/30 bg-laiton-300/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-laiton-200">Ton accompagnement recommandé</span>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-3 py-1 text-[10px] font-semibold text-emerald-200">Adapté à tes réponses</span>
          </div>
          <h3 id="formule-recommandee-title" className="mt-4 font-display text-3xl font-semibold text-white sm:text-4xl">{tier.nom}</h3>
          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200">Pourquoi ce choix</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-200">{recommandation.raison}</p>
          </div>
          <ul className="mt-5 grid gap-2 text-sm leading-6 text-graphite-100 sm:grid-cols-2">
            {tier.features.slice(0, 4).map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-laiton-300/[0.12] text-[10px] text-laiton-200">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-w-0 flex-col rounded-2xl border border-white/[0.1] bg-black/20 p-5 lg:w-72">
          <p className="text-xs font-medium text-graphite-400">Pour démarrer</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
            <strong className="font-display text-3xl font-semibold text-white">{tier.prix}</strong>
            <span className="text-xs leading-5 text-graphite-400">{tier.suffixe}</span>
          </div>
          {tier.trial && <p className="mt-2 text-sm font-semibold text-laiton-200">7 jours d&apos;essai</p>}
          {tier.limitedSpots && <p className="mt-2 text-xs font-semibold text-amber-200">Places volontairement limitées</p>}
          <Button
            onClick={() => setOuvert(true)}
            className="coai-rainbow-cta mt-5 w-full border-0 px-5 py-3 text-sm font-extrabold text-[#111216] shadow-[0_20px_55px_-18px_rgba(201,162,98,.8)]"
          >
            {ctaLabel} →
          </Button>
          <Link href="/pricing" className="mt-3 text-center text-xs text-graphite-400 underline decoration-white/20 underline-offset-4 transition hover:text-white">
            Voir les autres options
          </Link>
        </div>
      </div>

      {tier.founderOffer && <div className="relative mt-5"><MembreFondateurBadge /></div>}

      {ouvert && <ServiceDetailModal initialService={recommandation.service} onClose={() => setOuvert(false)} />}
    </section>
  );
}
