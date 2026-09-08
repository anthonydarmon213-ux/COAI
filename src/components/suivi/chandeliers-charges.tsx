"use client";

import { useState } from "react";
import type { PerfExercice } from "@/lib/suivi/historique-exercice";

export function ChandeliersCharges({ historique }: { historique: PerfExercice[] }) {
  const [selection, setSelection] = useState<string>("");
  const points = historique.slice(0, 12).reverse().flatMap((perf, index) => {
    if (!Number.isFinite(perf.date.getTime())) return [];
    const sets = perf.sets.filter(s => Number.isFinite(s.charge) && s.charge >= 0 && Number.isFinite(s.reps) && s.reps > 0);
    if (!sets.length) return [];
    const charges = sets.map(s => s.charge);
    return [{ id: `${perf.date.toISOString()}-${index}`, date: perf.date, sets,
      first: charges[0]!, last: charges[charges.length - 1]!, low: Math.min(...charges), high: Math.max(...charges) }];
  });
  if (!points.length) return null;
  const actif = points.find(p => p.id === selection) ?? points[points.length - 1]!;
  const max = Math.max(1, ...points.map(p => p.high)) * 1.1;
  const y = (charge: number) => 170 - charge / max * 140;
  const date = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return <section className="rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-cyan-950/30 to-black p-4">
    <h3 className="text-base font-semibold text-white">Tes charges, séance par séance</h3>
    <p className="mt-2 text-xs leading-5 text-graphite-300">Mèche : minimum et maximum. Corps : première et dernière charge enregistrée. Une baisse peut être prévue dans ta séance ; ce n’est pas une note de performance.</p>
    <svg viewBox="0 0 360 205" className="mt-3 w-full" role="img" aria-label="Chandeliers des charges en kilogrammes. Détail accessible dans le sélecteur ci-dessous.">
      {[0, .5, 1].map(r => <g key={r}><line x1="38" x2="346" y1={y(max*r)} y2={y(max*r)} stroke="white" strokeOpacity=".12"/><text x="2" y={y(max*r)+4} fill="#cbd5e1" fontSize="10">{Math.round(max*r)}</text></g>)}
      {points.map((p,i) => {const x=54+i*(276/Math.max(1,points.length-1));return <g key={p.id}>
        <title>{`${date(p.date)} : ${p.low} à ${p.high} kg`}</title>
        <line x1={x} x2={x} y1={y(p.low)} y2={y(p.high)} stroke="#67e8f9" strokeWidth="2"/>
        {p.high === p.low ? <circle cx={x} cy={y(p.first)} r="4" fill="#67e8f9"/> : <rect x={x-6} y={Math.min(y(p.first),y(p.last))-1} width="12" height={Math.max(2,Math.abs(y(p.first)-y(p.last)))} fill="#164e63" stroke="#67e8f9"/>}
        {(i===0 || i===points.length-1) && <text x={x} y="195" textAnchor="middle" fill="#cbd5e1" fontSize="10">{date(p.date)}</text>}
      </g>;})}
    </svg>
    <label className="block text-sm text-white">Explorer une séance
      <select className="mt-2 min-h-11 w-full rounded-lg border border-cyan-300/30 bg-slate-950 p-2 text-white" value={actif.id} onChange={e=>setSelection(e.target.value)}>
        {points.map((p,i)=><option key={p.id} value={p.id}>{date(p.date)} · séance {i+1}</option>)}
      </select>
    </label>
    <p className="mt-3 text-sm text-cyan-100" aria-live="polite">{actif.sets.map((s,i)=>`Série ${i+1} : ${s.reps} × ${s.charge} kg`).join(" · ")}</p>
    <p className="mt-2 text-xs text-graphite-400">12 dernières entrées au maximum. 0 kg désigne une charge externe nulle, pas le poids du corps mesuré. Les séries d’échauffement ne sont pas distinguées dans ces données.</p>
  </section>;
}
