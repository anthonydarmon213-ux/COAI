"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProgrammePretCard } from "@/components/programme/programme-pret-card";
import { CATEGORIE_PROGRAMME_LABEL, type CategorieProgrammePret, type ProgrammePret } from "@/lib/programmes-prets/catalogue";

type Item = { programme: ProgrammePret; photoUrl: string | null; deverrouille: boolean; gratuit: boolean };

// Filtre 100% client — les photos sont déjà résolues côté serveur pour tous
// les programmes en une fois (ProgrammesPretsPage), donc changer de filtre
// ici ne déclenche jamais de nouvel appel réseau.
export function ProgrammesPretsGrid({
  items,
  connecte,
  suiviInclus,
}: {
  items: Item[];
  connecte: boolean;
  suiviInclus: boolean;
}) {
  // Categorie lisible depuis l'URL : le menu peut ainsi pointer directement
  // sur les protocoles de recuperation, au lieu d'ouvrir la liste complete en
  // laissant l'utilisateur retrouver le bon filtre.
  const params = useSearchParams();
  const depuisUrl = params.get("categorie");
  const initiale = (CATEGORIE_PROGRAMME_LABEL as Record<string, string>)[depuisUrl ?? ""]
    ? (depuisUrl as CategorieProgrammePret)
    : null;
  const [categorie, setCategorie] = useState<CategorieProgrammePret | null>(initiale);

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

      <div className="grid gap-5 md:grid-cols-2">
        {filtres.map(({ programme, photoUrl, deverrouille, gratuit }) => (
          <ProgrammePretCard
            key={programme.slug}
            programme={programme}
            photoUrl={photoUrl}
            deverrouille={deverrouille}
            connecte={connecte}
            gratuit={gratuit}
            suiviInclus={suiviInclus}
            choixOfferts={items
              .filter((item) => item.programme.slug !== programme.slug && !item.deverrouille)
              .map((item) => ({ slug: item.programme.slug, nom: item.programme.nom }))}
          />
        ))}
      </div>
    </div>
  );
}
