"use client";

import { useMemo, useState } from "react";
import { RecetteCard } from "@/components/nutrition/recette-card";
import {
  OBJECTIF_RECETTE_LABEL,
  REGIME_LABEL,
  TYPE_REPAS_LABEL,
  filtrerRecettes,
  type ObjectifRecette,
  type Recette,
  type RegimeRecette,
  type TypeRepas,
} from "@/lib/nutrition/recettes";

type Item = { recette: Recette; photoUrl: string | null };

// Filtres 100% client — les photos sont déjà résolues côté serveur pour
// toutes les recettes en une fois (RecettesPage), donc changer de filtre ici
// ne déclenche jamais un nouvel appel réseau.
export function RecettesGrid({ items }: { items: Item[] }) {
  const [typeRepas, setTypeRepas] = useState<TypeRepas | null>(null);
  const [objectif, setObjectif] = useState<ObjectifRecette | null>(null);
  const [regime, setRegime] = useState<RegimeRecette | null>(null);

  const filtrees = useMemo(() => {
    const recettesFiltrees = filtrerRecettes(
      items.map((i) => i.recette),
      { typeRepas: typeRepas ?? undefined, objectif: objectif ?? undefined, regime: regime ?? undefined }
    );
    const slugs = new Set(recettesFiltrees.map((r) => r.slug));
    return items.filter((i) => slugs.has(i.recette.slug));
  }, [items, typeRepas, objectif, regime]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <FilterRow
          label="Repas"
          value={typeRepas}
          onChange={setTypeRepas}
          options={Object.entries(TYPE_REPAS_LABEL) as [TypeRepas, string][]}
        />
        <FilterRow
          label="Objectif"
          value={objectif}
          onChange={setObjectif}
          options={Object.entries(OBJECTIF_RECETTE_LABEL) as [ObjectifRecette, string][]}
        />
        <FilterRow
          label="Régime"
          value={regime}
          onChange={setRegime}
          options={Object.entries(REGIME_LABEL) as [RegimeRecette, string][]}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p role="status" className="text-sm text-graphite-400">{filtrees.length} recette{filtrees.length === 1 ? "" : "s"} affichée{filtrees.length === 1 ? "" : "s"}</p>
        {(typeRepas || objectif || regime) && (
          <button type="button" className="min-h-11 rounded-full border border-white/20 px-4 py-2 text-sm text-laiton-200" onClick={() => { setTypeRepas(null); setObjectif(null); setRegime(null); }}>
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {filtrees.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-graphite-400">
          Aucune recette ne correspond à cette combinaison de filtres. Essaie d&apos;en retirer un.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrees.map(({ recette, photoUrl }) => (
            <RecetteCard key={recette.slug} recette={recette} photoUrl={photoUrl} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterRow<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T | null;
  onChange: (value: T | null) => void;
  options: [T, string][];
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-graphite-500">{label} :</span>
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={`min-h-11 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          value === null ? "border-laiton-300/60 bg-laiton-400/15 text-laiton-200" : "border-white/10 text-graphite-400 hover:text-white"
        }`}
      >
        Tout
      </button>
      {options.map(([key, optLabel]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(value === key ? null : key)}
          className={`min-h-11 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            value === key ? "border-laiton-300/60 bg-laiton-400/15 text-laiton-200" : "border-white/10 text-graphite-400 hover:text-white"
          }`}
        >
          {optLabel}
        </button>
      ))}
    </div>
  );
}
