"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OffreConsentGate } from "@/components/compte/offre-consent-gate";
import { OneShotProgrammeButton } from "@/components/programme/one-shot-programme-button";
import { SubscribeButton } from "@/components/compte/subscribe-button";
import { SERVICE_INFO, type BesoinIdentifie } from "@/lib/dashboard/besoins-identifies";

// Vitrine personnalisée (14/08/2026) : traduit ce que le diagnostic a
// identifié chez cet utilisateur en besoins concrets, chacun avec le
// service COAI qui y répond — plutôt qu'un mur générique "débloquer".
// Toute la liste des besoins détectés est affichée (pas juste le premier),
// chacun avec son propre CTA d'achat (même consentement légal que /pricing,
// requis avant tout paiement réel où qu'il se déclenche).
export function BesoinsIdentifiesCard({ besoins }: { besoins: BesoinIdentifie[] }) {
  if (besoins.length === 0) return null;

  return (
    <section className="rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.05] p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">
        Ce que COAI a identifié pour toi
      </p>
      <h2 className="mt-2 text-2xl text-white">Les services qui répondent à ton profil.</h2>
      <div className="mt-5 flex flex-col gap-4">
        {besoins.map((b) => (
          <div
            key={`${b.service}-${b.besoin}`}
            className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-white">{b.besoin}</p>
              <p className="mt-1 text-xs leading-5 text-graphite-400">{b.explication}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-laiton-400">
                {SERVICE_INFO[b.service].label}
              </p>
            </div>
            <div className="w-full sm:w-64 sm:flex-none">
              {b.service === "IMPULSION" && (
                <OffreConsentGate
                  resumeConditions={
                    <>
                      Je reconnais avoir pris connaissance des conditions de l&apos;offre
                      Impulsion : paiement unique de 19€, programme généré immédiatement. Je
                      demande le début immédiat du service et reconnais renoncer à mon droit de
                      rétractation de 14 jours pour la partie du service déjà utilisée.
                    </>
                  }
                >
                  <OneShotProgrammeButton label="Débloquer — 19€" className="w-full" />
                </OffreConsentGate>
              )}
              {b.service === "TRANSFORMATION" && (
                <OffreConsentGate
                  resumeConditions={
                    <>
                      Je reconnais avoir pris connaissance des conditions de l&apos;offre
                      Transformation : 7 jours d&apos;accès gratuit à compter de ce jour, puis
                      passage automatique à un abonnement de 49€/mois, sauf résiliation avant la
                      fin des 7 jours. Je demande le début immédiat du service et reconnais
                      renoncer à mon droit de rétractation de 14 jours pour la partie du service
                      déjà utilisée durant la période offerte.
                    </>
                  }
                >
                  <SubscribeButton plan="STANDARD" label="Commencer mes 7 jours offerts" className="w-full" />
                </OffreConsentGate>
              )}
              {b.service === "VIP" && (
                <Link href={SERVICE_INFO.VIP.href}>
                  <Button variant="secondary" className="w-full">
                    Découvrir VIP
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
