"use client";

import { useMemo, useState } from "react";
import { ProgrammePretCard } from "@/components/programme/programme-pret-card";
import { CATEGORIE_PROGRAMME_LABEL, type CategorieProgrammePret, type ProgrammePret } from "@/lib/programmes-prets/catalogue";

type Item = { programme: ProgrammePret; photoUrl: string | null };

// Filtre 100% client — les photos sont déjà résolues côté serveur pour tous
// les programmes en une fois (ProgrammesPretsPage), donc changer de filtre
// ici ne déclenche jamais de nouvel appel réseau.
export function ProgrammesPretsGrid({ items }: { items: Item[] }) {
  const [categorie, setCategorie] = useState<CategorieProgrammePret | null>(null);

  const filtres = useMemo(
    () => (categorie ? items.filter((i) => i.programme.categorie === categorie) : items),
    [items, categorie]
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-graphite-500">Catégorie :</span>
        <button
          type="button"
          onClick={() => setCategorie(null)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
            categorie === null ? "border-laiton-300/60 bg-laiton-400/15 text-laiton-200" : "border-white/10 text-graphite-400 hover:text-white"
          }`}
        >
          Tout
        </button>
        {(Object.entries(CATEGORIE_PROGRAMME_LABEL) as [CategorieProgrammePret, string][]).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategorie(categorie === key ? null : key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              categorie === key ? "border-laiton-300/60 bg-laiton-400/15 text-laiton-200" : "border-white/10 text-graphite-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtres.map(({ programme, photoUrl }) => (
          <ProgrammePretCard key={programme.slug} programme={programme} photoUrl={photoUrl} />
        ))}
      </div>
    </div>
  );
}
