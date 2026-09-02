"use client";

import { useEffect, useState } from "react";
import { OFFRE_RENTREE_FIN, PRIX_APRES_OFFRE } from "@/lib/pricing/offre-rentree";

function restant(fin: Date, maintenant: Date) {
  const ms = fin.getTime() - maintenant.getTime();
  if (ms <= 0) return null;
  return {
    jours: Math.floor(ms / 86400000),
    heures: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    secondes: Math.floor((ms % 60000) / 1000),
  };
}

export function CompteAReboursRentree({ className = "" }: { className?: string }) {
  // Rendu serveur et premier rendu client doivent concorder : le décompte ne
  // démarre qu'après le montage, sinon l'heure du serveur et celle du
  // visiteur divergent et React signale une hydratation incohérente.
  const [temps, setTemps] = useState<ReturnType<typeof restant>>(null);

  useEffect(() => {
    setTemps(restant(OFFRE_RENTREE_FIN, new Date()));
    const id = window.setInterval(() => {
      setTemps(restant(OFFRE_RENTREE_FIN, new Date()));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Le message promo est rendu cote serveur : le masquer entierement jusqu'au
  // montage le rendait invisible aux moteurs de recherche et aux connexions
  // lentes. Seuls les chiffres attendent le client, l'heure du serveur et
  // celle du visiteur ne pouvant pas concorder.
  const cases: [number, string][] = temps ? [
    [temps.jours, temps.jours > 1 ? "jours" : "jour"],
    [temps.heures, "h"],
    [temps.minutes, "min"],
    [temps.secondes, "s"],
  ] : [];

  return (
    <div
      className={`rounded-2xl border border-laiton-300/30 bg-laiton-300/[0.06] px-5 py-4 text-center ${className}`}
      role="status"
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-200">
        Offre de rentrée
      </p>
      <p className="mt-2 text-sm leading-6 text-white">
        Bloque ton Pass IA à <strong>19,99&nbsp;€/mois</strong> à vie.
        <span className="text-graphite-300">
          {" "}Le tarif passera à {PRIX_APRES_OFFRE} pour les nouveaux membres.
        </span>
      </p>
      <div className="mt-3 flex min-h-[3.25rem] items-center justify-center gap-2">
        {cases.map(([valeur, label]) => (
          <span
            key={label}
            className="flex min-w-[3.25rem] flex-col rounded-xl border border-white/10 bg-black/40 px-2.5 py-1.5"
          >
            <span className="font-display text-lg font-semibold tabular-nums text-white">
              {String(valeur).padStart(2, "0")}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-graphite-400">
              {label}
            </span>
          </span>
        ))}
      </div>
      <p className="mt-2.5 font-mono text-[9px] uppercase tracking-[0.14em] text-graphite-500">
        Jusqu&apos;au 31 octobre
      </p>
    </div>
  );
}
