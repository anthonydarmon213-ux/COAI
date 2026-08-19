"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  EXERCICES,
  GROUPE_PRINCIPAL_LABEL,
  MATERIEL_LABEL,
  TYPE_LABEL,
  NIVEAU_EXERCICE_LABEL,
  type GroupePrincipal,
  type Materiel,
  type TypeExercice,
} from "@/lib/exercices/catalogue";

const GROUPES = Object.keys(GROUPE_PRINCIPAL_LABEL) as GroupePrincipal[];
const MATERIELS = Object.keys(MATERIEL_LABEL) as Materiel[];
const TYPES = Object.keys(TYPE_LABEL) as TypeExercice[];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FilterGroup<T extends string>({
  titre,
  options,
  labels,
  actifs,
  onToggle,
}: {
  titre: string;
  options: T[];
  labels: Record<T, string>;
  actifs: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.06em] text-graphite-400">{titre}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              actifs.includes(o)
                ? "border-laiton-400/50 bg-laiton-400/15 text-laiton-200"
                : "border-graphite-800 text-graphite-400 hover:text-white"
            }`}
          >
            {labels[o]}
          </button>
        ))}
      </div>
    </div>
  );
}

// Catalogue d'exercices (19/08/2026, chantier demandé par Anthony) —
// filtres 100% côté client : la liste est statique (src/lib/exercices/catalogue.ts),
// pas d'appel réseau nécessaire pour filtrer. Filtres cumulables (ET entre
// catégories, OU à l'intérieur d'une catégorie) sur groupe musculaire,
// matériel et type — jamais sur le niveau, affiché seulement en info sur
// chaque carte pour rester simple.
//
// Photos Pexels ajoutées le même jour (même traitement que les recettes) :
// résolues une seule fois côté serveur pour les 48 exercices (page.tsx),
// passées ici en prop — changer un filtre ne déclenche jamais de nouvel
// appel réseau.
export function ExerciceCatalogue({ photos }: { photos: Record<string, string | null> }) {
  const [groupes, setGroupes] = useState<GroupePrincipal[]>([]);
  const [materiels, setMateriels] = useState<Materiel[]>([]);
  const [types, setTypes] = useState<TypeExercice[]>([]);

  const filtres = useMemo(() => {
    return EXERCICES.filter((ex) => {
      if (groupes.length > 0 && !groupes.includes(ex.groupePrincipal)) return false;
      if (materiels.length > 0 && !ex.materiel.some((m) => materiels.includes(m))) return false;
      if (types.length > 0 && !types.includes(ex.type)) return false;
      return true;
    });
  }, [groupes, materiels, types]);

  const aucunFiltre = groupes.length === 0 && materiels.length === 0 && types.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <FilterGroup titre="Groupe musculaire" options={GROUPES} labels={GROUPE_PRINCIPAL_LABEL} actifs={groupes} onToggle={(v) => setGroupes((prev) => toggle(prev, v))} />
        <FilterGroup titre="Matériel" options={MATERIELS} labels={MATERIEL_LABEL} actifs={materiels} onToggle={(v) => setMateriels((prev) => toggle(prev, v))} />
        <FilterGroup titre="Type" options={TYPES} labels={TYPE_LABEL} actifs={types} onToggle={(v) => setTypes((prev) => toggle(prev, v))} />
        {!aucunFiltre && (
          <button
            type="button"
            onClick={() => { setGroupes([]); setMateriels([]); setTypes([]); }}
            className="self-start font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-500 transition hover:text-white"
          >
            Réinitialiser les filtres
          </button>
        )}
      </Card>

      <p className="text-xs text-graphite-500">
        {filtres.length} exercice{filtres.length > 1 ? "s" : ""}
        {aucunFiltre ? "" : " correspondant" + (filtres.length > 1 ? "s" : "")}.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtres.map((ex) => {
          const photoUrl = photos[ex.photoQuery] ?? null;
          return (
            <article
              key={ex.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_-48px_rgba(0,0,0,0.9)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-laiton-400/25"
            >
              <div className="relative h-36 w-full overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(196,154,82,.2),transparent_60%),#171b1d]">
                {photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- source Pexels externe, cf. RecetteCard pour la même justification
                  <img src={photoUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e10] via-transparent to-transparent" aria-hidden="true" />
                <div className="absolute right-2.5 top-2.5">
                  <Badge tone="neutral">{NIVEAU_EXERCICE_LABEL[ex.niveau]}</Badge>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-4">
                <h3 className="text-sm font-semibold text-white">{ex.nom}</h3>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-graphite-500">
                  <span>{GROUPE_PRINCIPAL_LABEL[ex.groupePrincipal]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{TYPE_LABEL[ex.type]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ex.materiel.map((m) => MATERIEL_LABEL[m]).join(", ")}</span>
                </div>
                <p className="text-sm leading-6 text-graphite-400">{ex.consigne}</p>
              </div>
            </article>
          );
        })}
      </div>

      {filtres.length === 0 && (
        <p className="text-sm text-graphite-400">Aucun exercice ne correspond à cette combinaison de filtres.</p>
      )}
    </div>
  );
}
