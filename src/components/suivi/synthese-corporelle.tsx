"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";
import { MuscleMap } from "@/components/programme/muscle-map";
import { MUSCLE_LABEL, type MuscleSlug } from "@/lib/exercices/muscles";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

// Synthèse corporelle (01/09/2026, demande Anthony, inspirée des bornes
// d'impédancemétrie). Différence essentielle : une borne mesure la
// composition du corps par courant électrique — COAI ne peut pas produire
// ces chiffres et ne les invente pas. Ce qu'on montre ici est ce qu'on sait
// réellement : le volume d'entraînement par zone, issu du carnet de séances.
//
// La rotation est une bascule avant/arrière en CSS 3D, pas un vrai 360° :
// la librairie fournit ces deux vues, et un modèle 3D pour le reste serait
// une dépendance lourde pour un gain d'usage nul.

export function SyntheseCorporelle({
  intensites,
  volumes,
  nbSeances,
}: {
  intensites: Partial<Record<MuscleSlug, number>>;
  volumes: Partial<Record<MuscleSlug, number>>;
  nbSeances: number;
}) {
  const [dos, setDos] = useState(false);

  const classement = (Object.entries(volumes) as [MuscleSlug, number][])
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const actifs = classement.map(([m]) => m);
  const top = classement.slice(0, 3);
  // Zones jamais touchées sur la fenêtre : c'est l'information utile, celle
  // qu'on ne voit pas en regardant ses propres séances.
  const oubliees = (Object.keys(MUSCLE_LABEL) as MuscleSlug[]).filter((m) => !(volumes[m] && volumes[m]! > 0));

  if (nbSeances === 0) {
    return (
      <Card className="p-5">
        <SectionLabel>Ta carte musculaire</SectionLabel>
        <p className="mt-2 text-sm leading-6 text-graphite-300">
          Enregistre tes séances et cette silhouette se remplira : chaque zone
          s&apos;éclaire selon le volume que tu lui as réellement consacré.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionLabel>Ta carte musculaire</SectionLabel>
          <p className="mt-1 text-xs text-graphite-400">
            Volume travaillé sur 30 jours · {nbSeances} séance{nbSeances > 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDos((v) => !v)}
          aria-pressed={dos}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-graphite-200 transition hover:border-laiton-300/40 hover:text-white"
        >
          <RotateCw size={13} aria-hidden="true" />
          {dos ? "Voir de face" : "Voir de dos"}
        </button>
      </div>

      <div className="coai-silhouette-scene">
        <div className={`coai-silhouette-flip ${dos ? "coai-silhouette-dos" : ""}`}>
          <div className="coai-silhouette-face">
            <MuscleMap activeMuscles={actifs} vue="front" intensites={intensites} echelle={0.9} sansLegende />
          </div>
          <div className="coai-silhouette-face coai-silhouette-arriere">
            <MuscleMap activeMuscles={actifs} vue="back" intensites={intensites} echelle={0.9} sansLegende />
          </div>
        </div>
      </div>

      {top.length > 0 && (
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-graphite-400">
            Le plus travaillé
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {top.map(([m]) => (
              <span key={m} className="rounded-full border border-laiton-300/30 bg-laiton-400/10 px-2.5 py-1 text-[11px] font-semibold text-laiton-200">
                {MUSCLE_LABEL[m]}
              </span>
            ))}
          </div>
        </div>
      )}

      {oubliees.length > 0 && (
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-graphite-400">
            Pas touché ce mois-ci
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {oubliees.map((m) => (
              <span key={m} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-graphite-400">
                {MUSCLE_LABEL[m]}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
