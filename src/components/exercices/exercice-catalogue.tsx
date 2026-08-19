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
// entièrement côté client : la liste est statique (src/lib/exercices/catalogue.ts),
// pas d'appel réseau nécessaire pour filtrer. Filtres cumulables (ET entre
// catégories, OU à l'intérieur d'une catégorie) sur groupe musculaire,
// matériel et type — jamais sur le niveau, affiché seulement en info sur
// chaque carte pour rester simple.
export function ExerciceCatalogue() {
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
        {filtres.map((ex) => (
          <Card key={ex.id} className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">{ex.nom}</h3>
              <Badge tone="neutral">{NIVEAU_EXERCICE_LABEL[ex.niveau]}</Badge>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-graphite-500">
              <span>{GROUPE_PRINCIPAL_LABEL[ex.groupePrincipal]}</span>
              <span aria-hidden="true">·</span>
              <span>{TYPE_LABEL[ex.type]}</span>
              <span aria-hidden="true">·</span>
              <span>{ex.materiel.map((m) => MATERIEL_LABEL[m]).join(", ")}</span>
            </div>
            <p className="text-sm leading-6 text-graphite-400">{ex.consigne}</p>
          </Card>
        ))}
      </div>

      {filtres.length === 0 && (
        <p className="text-sm text-graphite-400">Aucun exercice ne correspond à cette combinaison de filtres.</p>
      )}
    </div>
  );
}
