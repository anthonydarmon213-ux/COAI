"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Resultat = {
  decision: "GARDER" | "PROGRESSER" | "REDUIRE" | "MODIFIER" | "ADAPTER";
  resume: string;
  changements: { cible: string; avant: string | number | null; apres: string | number | null; raison: string }[];
  donneesSuffisantes: boolean;
  nouvelleVersion: number | null;
};

const DECISION_LABEL: Record<Resultat["decision"], { label: string; tone: "neutral" | "success" | "warning" }> = {
  GARDER: { label: "Programme maintenu", tone: "neutral" },
  PROGRESSER: { label: "Progression", tone: "success" },
  REDUIRE: { label: "Volume réduit", tone: "warning" },
  MODIFIER: { label: "Modification", tone: "success" },
  ADAPTER: { label: "Adaptation ponctuelle", tone: "success" },
};

// Déclenchement manuel du moteur d'adaptation (Phase 1, cf.
// src/lib/adaptation/engine.ts) — analyse les signaux réels de
// l'utilisateur (séances, check-ins) et explique toujours sa décision,
// jamais de changement silencieux (exigence centrale de la vision produit).
export function AnalyserAdaptationButton({ pilierSlug }: { pilierSlug: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    setResultat(null);
    try {
      const res = await fetch(`/api/programmes/${pilierSlug}/adapter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'analyse.");
      setResultat(data);
      if (data.nouvelleVersion) router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="secondary" onClick={handleClick} disabled={loading}>
        {loading ? "Analyse en cours…" : "Analyser mon programme"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {resultat && (
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          {!resultat.donneesSuffisantes ? (
            <p className="text-sm text-graphite-400">{resultat.resume}</p>
          ) : (
            <>
              <Badge tone={DECISION_LABEL[resultat.decision].tone}>
                {DECISION_LABEL[resultat.decision].label}
              </Badge>
              <p className="text-sm leading-6 text-graphite-200">{resultat.resume}</p>
              {resultat.changements.length > 0 && (
                <ul className="flex flex-col gap-1 text-xs text-graphite-400">
                  {resultat.changements.map((c, i) => (
                    <li key={i}>
                      <span className="text-graphite-200">{c.cible}</span>
                      {c.avant != null && c.apres != null ? ` : ${c.avant} → ${c.apres}` : ""}
                      {" — "}
                      {c.raison}
                    </li>
                  ))}
                </ul>
              )}
              {resultat.nouvelleVersion && (
                <p className="mt-1 text-xs text-laiton-300">
                  Nouvelle version (V{resultat.nouvelleVersion}) créée — rafraîchis pour la voir.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
