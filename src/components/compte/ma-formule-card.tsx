"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ServiceDetailModal } from "@/components/marketing/service-detail-modal";
import { TIER_BY_SERVICE, type ServiceKey } from "@/lib/pricing/tiers";

const AUTRES_PAR_FORMULE: Record<ServiceKey | "AUCUNE", ServiceKey[]> = {
  AUCUNE: ["IMPULSION", "TRANSFORMATION", "VIP"],
  IMPULSION: ["TRANSFORMATION", "VIP"],
  TRANSFORMATION: ["VIP"],
  VIP: [],
};

// Résumés courts et distincts par formule (16/08/2026, correction Anthony —
// "on ne comprend pas les différentes formules") : afficher la première
// feature brute de tiers.ts (ex: "Journal de séances" pour Pass IA, "Tout
// ce qui est inclus dans Pass IA" pour Coaching Hybride) ne dit rien de
// distinctif sur chaque palier. Ces phrases sont écrites spécifiquement pour
// comparer d'un coup d'œil — le détail complet reste dans ServiceDetailModal.
const RESUME_COMPARATIF: Record<ServiceKey, string> = {
  IMPULSION: "Personal Trainer autonome et adaptatif — 19,99€/mois",
  TRANSFORMATION: "IA 24/7 + regard et ajustements humains — 99€/mois",
  VIP: "1 à 4 séances privées par mois, présentiel ou visio — dès 199€/mois",
};

// Carte "Ta formule" (16/08/2026, demande Anthony) : jusqu'ici rien sur
// /compte/profil n'expliquait à l'abonné ce que sa formule actuelle couvre
// ni ce que les formules supérieures ajoutent — juste un lien vers son
// programme. Réutilise TIER_BY_SERVICE (source unique déjà partagée avec
// /pricing et ServiceDetailModal) pour ne jamais faire diverger le contenu.
export function MaFormuleCard({ formuleActuelle }: { formuleActuelle: ServiceKey | null }) {
  const [serviceOuvert, setServiceOuvert] = useState<ServiceKey | null>(null);

  const cle = formuleActuelle ?? "AUCUNE";
  const tierActuel = formuleActuelle ? TIER_BY_SERVICE[formuleActuelle] : null;
  const autres = AUTRES_PAR_FORMULE[cle];

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Ta formule</p>
        {tierActuel ? (
          <>
            <h2 className="mt-2 font-display text-2xl text-white">{tierActuel.nom}</h2>
            <p className="mt-1 text-sm leading-6 text-graphite-300">{tierActuel.description}</p>
            <ul className="mt-4 flex flex-col gap-1.5 text-sm leading-6 text-graphite-200">
              {tierActuel.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-0.5 text-laiton-300">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-sm leading-6 text-graphite-300">
            Choisis ton niveau d&apos;attention : Pass IA, Coaching Hybride ou VIP.
          </p>
        )}
      </div>

      {autres.length > 0 && (
        <div className="border-t border-white/[0.07] pt-5">
          <p className="text-sm font-semibold text-white">
            {tierActuel ? "Envie d'évoluer plus vite ?" : "Choisis ta formule"}
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            {autres.map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => setServiceOuvert(service)}
                className="flex flex-1 flex-col items-start gap-1 rounded-xl border border-laiton-400/25 bg-laiton-400/[0.05] px-4 py-3 text-left transition hover:border-laiton-400/45 hover:bg-laiton-400/[0.09]"
              >
                <span className="font-semibold text-white">{TIER_BY_SERVICE[service].nom}</span>
                <span className="text-xs leading-5 text-graphite-300">{RESUME_COMPARATIF[service]}</span>
              </button>
            ))}
          </div>
          <Button className="mt-4" onClick={() => setServiceOuvert(autres[0] ?? null)}>
            Voir les tarifs
          </Button>
        </div>
      )}

      {serviceOuvert && (
        <ServiceDetailModal initialService={serviceOuvert} onClose={() => setServiceOuvert(null)} />
      )}
    </div>
  );
}
