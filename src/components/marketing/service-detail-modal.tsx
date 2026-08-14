"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OffreConsentGate } from "@/components/compte/offre-consent-gate";
import { OneShotProgrammeButton } from "@/components/programme/one-shot-programme-button";
import { SubscribeButton } from "@/components/compte/subscribe-button";
import { TIER_BY_SERVICE, VIP_MESSAGE, vipReservationHref, type ServiceKey } from "@/lib/pricing/tiers";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const SERVICES: ServiceKey[] = ["IMPULSION", "TRANSFORMATION", "VIP"];

// Modal plein écran (14/08/2026) — inspiré des paywalls d'app mobile (nom
// de l'offre en grand, onglets pour comparer, liste de bénéfices, prix,
// un seul CTA) : quand quelqu'un clique sur un service (ex: depuis la
// vitrine "besoins identifiés" du dashboard), il voit tous les tarifs sur
// un même écran plutôt qu'un simple bouton isolé. Contenu et logique
// d'achat réutilisés tels quels depuis /pricing (src/lib/pricing/tiers.ts,
// mêmes composants de checkout, même consentement légal) — jamais dupliqués
// ni réinventés ici.
export function ServiceDetailModal({
  initialService,
  onClose,
}: {
  initialService: ServiceKey;
  onClose: () => void;
}) {
  const [service, setService] = useState<ServiceKey>(initialService);
  const [annual, setAnnual] = useState(true);
  const tier = TIER_BY_SERVICE[service];
  const vipHref = buildWhatsAppLink(VIP_MESSAGE);

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

  const prixAffiche = !tier.oneShot && !tier.sessions && annual && tier.nom === "Transformation" ? "490€" : tier.prix;
  const suffixeAffiche = !tier.oneShot && !tier.sessions && annual && tier.nom === "Transformation" ? "/an" : tier.suffixe;
  const essaiAffiche =
    tier.nom === "Transformation" ? (annual ? "7 jours offerts · puis 490€/an" : "7 jours offerts · puis 49€/mois") : tier.essai;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#0b0c0e]" role="dialog" aria-modal="true">
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

        {/* Onglets — comparer les 3 services sans quitter l'écran */}
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          {SERVICES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setService(s)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                s === service ? "bg-laiton-400 text-graphite-950" : "text-graphite-300 hover:text-white"
              }`}
            >
              {TIER_BY_SERVICE[s].nom}
            </button>
          ))}
        </div>

        {/* Liste des bénéfices */}
        <div className="w-full rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6 text-left">
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

        {/* Bascule mensuel/annuel — uniquement Transformation (abonnement) */}
        {tier.plan && (
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-full px-4 py-2 text-sm ${!annual ? "bg-laiton-400 text-graphite-950" : "text-graphite-300"}`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`rounded-full px-4 py-2 text-sm ${annual ? "bg-laiton-400 text-graphite-950" : "text-graphite-300"}`}
            >
              Annuel · 2 mois offerts
            </button>
          </div>
        )}

        {/* Bloc prix */}
        {tier.sessions ? (
          <div className="flex w-full flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 text-left">
            {tier.sessions.map((session) => {
              const href = vipReservationHref(session.label, session.prix);
              return (
                <div key={session.label} className="flex flex-col gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-graphite-300">{session.label}</span>
                    <span className="font-semibold text-white">{session.prix}</span>
                  </div>
                  {href && (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="secondary" size="compact" className="w-full">
                        Réserver via WhatsApp
                      </Button>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-4xl font-semibold text-white">{prixAffiche}</span>
            <span className="text-sm text-graphite-400">{suffixeAffiche}</span>
          </div>
        )}

        {/* CTA */}
        <div className="flex w-full flex-col items-center gap-2">
          {tier.sessions ? (
            vipHref && (
              <a href={vipHref} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button variant="ghost" className="w-full">Une question ? Écrire sur WhatsApp</Button>
              </a>
            )
          ) : tier.oneShot ? (
            <OffreConsentGate
              resumeConditions={
                <>
                  Je reconnais avoir pris connaissance des conditions de l&apos;offre Impulsion :
                  paiement unique de 19€, programme généré immédiatement. Je demande le début
                  immédiat du service et reconnais renoncer à mon droit de rétractation de 14
                  jours pour la partie du service déjà utilisée.
                </>
              }
            >
              <OneShotProgrammeButton label="Générer mon programme — 19€" className="w-full" />
            </OffreConsentGate>
          ) : tier.plan ? (
            <OffreConsentGate
              resumeConditions={
                <>
                  Je reconnais avoir pris connaissance des conditions de l&apos;offre
                  Transformation : 7 jours d&apos;accès gratuit à compter de ce jour, puis passage
                  automatique à un abonnement de {annual ? "490€/an" : "49€/mois"}, sauf
                  résiliation avant la fin des 7 jours. Je demande le début immédiat du service et
                  reconnais renoncer à mon droit de rétractation de 14 jours pour la partie du
                  service déjà utilisée durant la période offerte.
                </>
              }
            >
              <SubscribeButton
                plan={tier.plan}
                billing={annual ? "ANNUAL" : "MONTHLY"}
                label="Commencer mes 7 jours offerts"
                className="w-full"
              />
            </OffreConsentGate>
          ) : null}
          {essaiAffiche && <span className="text-sm font-medium text-laiton-300">{essaiAffiche}</span>}
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
