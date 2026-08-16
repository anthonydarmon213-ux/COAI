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

  const priorite = besoins[0]!;
  const autres = besoins.slice(1);

  return (
    <section className="rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.05] p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">
        Lecture de ton diagnostic
      </p>
      <h2 className="mt-2 font-display text-2xl text-white">Ton plan de progression personnalisé.</h2>
      <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 sm:p-6">
        <p className="text-lg font-bold text-white">{priorite.besoin}</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-300">{priorite.explication}</p>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-laiton-400">
          Recommandation · {SERVICE_INFO[priorite.service].label}
        </p>
        <Button className="coai-rainbow-cta mt-5 min-w-60 border-0 text-[#111216]" onClick={() => setServiceOuvert(priorite.service)}>
          Voir ma recommandation
        </Button>
      </div>

      {autres.length > 0 ? (
        <div className="mt-4 border-t border-white/[0.07] pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-graphite-500">Autres points identifiés</p>
          <ul className="mt-3 grid gap-2 text-sm text-graphite-300 sm:grid-cols-2">
            {autres.map((b) => <li key={`${b.service}-${b.besoin}`} className="flex gap-2"><span className="text-laiton-400">•</span>{b.besoin}</li>)}
          </ul>
        </div>
      ) : null}

      {serviceOuvert && (
        <ServiceDetailModal initialService={serviceOuvert} onClose={() => setServiceOuvert(null)} />
      )}
    </section>
  );
}
