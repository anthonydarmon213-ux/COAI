"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ServiceDetailModal } from "@/components/marketing/service-detail-modal";
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

  return (
    <div className="relative w-full overflow-hidden rounded-[1.75rem] border-2 border-laiton-400/45 bg-[radial-gradient(circle_at_12%_0%,rgba(201,162,98,.16),transparent_20rem),#111518] p-6 text-left shadow-[0_35px_95px_-48px_rgba(0,0,0,.9)] sm:p-8">
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-laiton-300 via-laiton-500 to-acier-400" aria-hidden="true" />
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-laiton-300">Notre recommandation pour toi</p>
      <h3 className="mt-2 font-display text-2xl text-white sm:text-3xl">{tier.nom}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-300">{recommandation.raison}</p>
      <ul className="mt-4 flex flex-col gap-1.5 text-sm leading-6 text-graphite-200">
        {tier.features.slice(0, 4).map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-0.5 text-laiton-300">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button
          onClick={() => setOuvert(true)}
          className="coai-rainbow-cta border-0 px-6 py-3 text-sm font-extrabold text-[#111216] shadow-[0_20px_55px_-18px_rgba(201,162,98,.8)]"
        >
          Voir {tier.nom} en détail →
        </Button>
        <Link href="/pricing" className="text-sm text-graphite-300 underline transition hover:text-white">
          Comparer les 3 formules
        </Link>
      </div>

      {ouvert && <ServiceDetailModal initialService={recommandation.service} onClose={() => setOuvert(false)} />}
    </div>
  );
}
