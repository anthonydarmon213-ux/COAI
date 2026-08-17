"use client";

import { useEffect } from "react";
import Link from "next/link";
import { OffreConsentGate } from "@/components/compte/offre-consent-gate";
import { SubscribeButton } from "@/components/compte/subscribe-button";
import { TIER_BY_SERVICE, vipReservationHref, type ServiceKey } from "@/lib/pricing/tiers";

// Modal plein écran (14/08/2026, simplifié le 16/08/2026 — demande Anthony :
// "il faut mettre une seule formule et ce qu'elle propose exactement et à la
// fin on demande le prix") : une seule offre à la fois, présentée
// pédagogiquement (ce que ça comprend, expliqué simplement) puis le prix en
// tout dernier, comme une réponse à "cette formule te correspond ?" plutôt
// qu'un tableau à comparer. Avant, des onglets permettaient de basculer
// entre Impulsion/Transformation/VIP dans la même fenêtre — retiré : le menu
// (Impulsion/Transformation/VIP en entrées séparées) et les vitrines
// personnalisées (besoins identifiés, "ta formule") choisissent déjà la
// bonne offre à l'ouverture, jamais besoin de comparer les 3 au même endroit.
// Contenu et logique d'achat réutilisés tels quels depuis /pricing
// (src/lib/pricing/tiers.ts, mêmes composants de checkout, même
// consentement légal) — jamais dupliqués ni réinventés ici.
export function ServiceDetailModal({
  initialService,
  onClose,
}: {
  initialService: ServiceKey;
  onClose: () => void;
}) {
  // Le mensuel réduit la friction au premier achat. L'annuel reste visible
  // comme économie, sans être imposé au prospect.
  const tier = TIER_BY_SERVICE[initialService];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="coai-service-modal fixed inset-0 z-[100] overflow-y-auto bg-[#0b0c0e]" role="dialog" aria-modal="true">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="fixed left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-xl text-white backdrop-blur"
      >
        ×
      </button>

      <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-6 pb-16 pt-20 text-center">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">{tier.nom}</h1>
        <p className="max-w-sm text-sm leading-6 text-graphite-300">{tier.description}</p>

        {/* Liste des bénéfices, présentée pédagogiquement */}
        <div className="w-full rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 text-left">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">
            Ce que {tier.nom} comprend exactement
          </p>
          <ul className="flex flex-col gap-4">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full border border-laiton-400/30 bg-laiton-400/10 text-xs text-laiton-300">
                  ✓
                </span>
                <span className="text-sm leading-6 text-graphite-200">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bloc prix — volontairement la dernière chose montrée : la
            personne a déjà compris ce que la formule fait avant de voir le
            prix, jamais l'inverse. */}
        <p className="text-sm font-medium text-graphite-300">
          Cette formule te correspond ? Voici le prix.
        </p>
        {!tier.sessions && (
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-4xl font-semibold text-white">{tier.prix}</span>
            <span className="text-sm text-graphite-400">{tier.suffixe}</span>
          </div>
        )}

        {/* CTA */}
        <div className="flex w-full flex-col items-center gap-2">
          {tier.sessions ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-semibold text-white">199€</span>
                <span className="text-sm text-graphite-400">/mois</span>
              </div>
              <p className="text-sm text-graphite-300">1 séance privée mensuelle incluse</p>
              <OffreConsentGate resumeConditions={<>Abonnement VIP de 199€/mois, résiliable à tout moment, incluant 1 séance privée par mois.</>}>
                <SubscribeButton plan="PREMIUM" vipSessions={1} label="Choisir VIP" className="coai-rainbow-cta w-full border-0" />
              </OffreConsentGate>
              <a href={vipReservationHref("un rythme VIP de 2 à 4 séances par mois", "sur mesure") ?? "/vip"} target="_blank" rel="noreferrer" className="text-sm text-laiton-300 underline">
                Besoin de davantage de séances ? Parlons-en
              </a>
            </>
          ) : (
            <OffreConsentGate
              resumeConditions={
                <>
                  Je reconnais avoir pris connaissance des conditions de l&apos;offre
                  {tier.nom} : {tier.prix}/mois, résiliable à tout moment. {tier.trial ? "La facturation mensuelle commence après 7 jours d'essai, sauf résiliation." : "La facturation commence immédiatement."}
                </>
              }
            >
              <SubscribeButton
                plan={tier.plan}
                label={tier.trial ? "Commencer mes 7 jours d'essai" : `Choisir ${tier.nom}`}
                className="coai-rainbow-cta w-full border-0 text-[#111216]"
              />
            </OffreConsentGate>
          )}
          {tier.trial && <span className="text-sm font-medium text-laiton-300">7 jours d&apos;essai</span>}
          {tier.plan === "PREMIUM" && <a href={vipReservationHref("une transformation privée de longue durée", "sur devis") ?? "/vip"} target="_blank" rel="noreferrer" className="text-sm text-laiton-300 underline">Parler d&apos;une transformation plus longue</a>}
        </div>

        <p className="text-xs text-graphite-500">
          En débloquant une offre, tu acceptes nos{" "}
          <Link href="/cgv" target="_blank" className="underline hover:text-laiton-400">
            CGV
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
