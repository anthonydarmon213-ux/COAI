"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ServiceDetailModal } from "@/components/marketing/service-detail-modal";
import { SERVICE_INFO, type BesoinIdentifie } from "@/lib/dashboard/besoins-identifies";

// Vitrine personnalisée (14/08/2026) : traduit ce que le diagnostic a
// identifié chez cet utilisateur en besoins concrets, chacun avec le
// service COAI qui y répond — plutôt qu'un mur générique "débloquer".
// Toute la liste des besoins détectés est affichée (pas juste le premier).
// Cliquer sur un service ouvre l'écran plein tarif (ServiceDetailModal,
// façon paywall d'app mobile) plutôt qu'un bouton d'achat isolé — l'achat
// réel s'y déclenche, avec le même consentement légal que /pricing.
export function BesoinsIdentifiesCard({ besoins }: { besoins: BesoinIdentifie[] }) {
  const [serviceOuvert, setServiceOuvert] = useState<BesoinIdentifie["service"] | null>(null);

  if (besoins.length === 0) return null;

  return (
    <section className="rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.05] p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">
        Lecture de ton diagnostic
      </p>
      <h2 className="mt-2 font-display text-2xl text-white">Ton plan de progression personnalisé.</h2>
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
            <div className="w-full sm:w-56 sm:flex-none">
              <Button className="w-full" onClick={() => setServiceOuvert(b.service)}>
                Découvrir la solution
              </Button>
            </div>
          </div>
        ))}
      </div>

      {serviceOuvert && (
        <ServiceDetailModal initialService={serviceOuvert} onClose={() => setServiceOuvert(null)} />
      )}
    </section>
  );
}
