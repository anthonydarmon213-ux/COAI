"use client";

import { useState } from "react";
import { SubscribeButton } from "@/components/compte/subscribe-button";

type Billing = "MONTHLY" | "ANNUAL" | "QUARTERLY";

export function StandardBilling({ initialBilling, quarterlyPrice }: { initialBilling: Billing; quarterlyPrice: number }) {
  const [billing, setBilling] = useState<Billing>(initialBilling);
  const annual = billing === "ANNUAL";
  const quarterly = billing === "QUARTERLY";
  const amount = annual ? "119" : quarterly ? String(quarterlyPrice).replace(".", ",") : "19,99";
  const period = annual ? "/ an" : quarterly ? "/ 3 mois" : "/ mois";
  return (
    <div>
      <div role="group" aria-label="Facturation COAI Essentiel" className="flex rounded-full border border-cyan-300/30 bg-black/25 p-1">
        {([['MONTHLY', 'Mensuel'], ['ANNUAL', 'Annuel']] as const).map(([value, label]) => (
          <button key={value} type="button" aria-pressed={billing === value} onClick={() => setBilling(value)}
            className={`min-h-12 flex-1 rounded-full px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 ${billing === value ? "bg-cyan-200 text-slate-950" : "text-white hover:bg-white/10"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="mt-6 min-h-36" aria-live="polite" aria-atomic="true">
        <p className="flex flex-wrap items-baseline gap-2"><strong className="text-5xl font-semibold tracking-tight text-white">{amount} €</strong><span className="text-base text-slate-300">{period}</span></p>
        <p className="mt-3 text-sm leading-6 text-slate-200">
          {annual ? "119 € facturés en une fois chaque année. Soit 9,92 €/mois en équivalent, pas en prélèvement mensuel." : quarterly ? `${quarterlyPrice} € facturés pour 3 mois. Le tarif du renouvellement est précisé au paiement.` : "19,99 € prélevés chaque mois. Résiliable à tout moment."}
        </p>
        {annual && <p className="mt-2 text-sm font-medium text-cyan-200">120,88 € économisés par rapport à 12 mois à 19,99 €.</p>}
      </div>
      <SubscribeButton key={billing} plan="PASS_IA" billing={billing} label={`Choisir ${annual ? "l’annuel" : quarterly ? "3 mois" : "le mensuel"} · ${amount} € ${period}`} className="!bg-cyan-200 !text-slate-950 w-full border-0 hover:!bg-cyan-100" />
      <p className="mt-3 text-xs leading-5 text-slate-300">7 jours d’essai si tu es éligible, puis facturation sauf résiliation. Conditions et montant confirmés avant paiement.</p>
      <details className="mt-4 border-t border-white/10 pt-3 text-sm text-slate-300" open={quarterly || undefined}>
        <summary className="cursor-pointer">Tu préfères une formule de 3 mois ?</summary>
        <button type="button" onClick={() => setBilling("QUARTERLY")} className="mt-3 rounded-lg border border-white/20 px-4 py-2 text-white focus-visible:ring-2 focus-visible:ring-cyan-200">Sélectionner 3 mois · {quarterlyPrice} €</button>
      </details>
    </div>
  );
}
