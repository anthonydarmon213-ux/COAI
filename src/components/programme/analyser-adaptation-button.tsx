"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdaptationResultat, type ResultatAdaptationUI } from "@/components/programme/adaptation-resultat";

// Déclenchement manuel du moteur d'adaptation (cf. src/lib/adaptation/
// engine.ts) — analyse les signaux réels de l'utilisateur (séances,
// check-ins) et explique toujours sa décision, jamais de changement
// silencieux. Ne l'applique pas directement : AdaptationResultat gère
// l'étape "Accepter" / "Garder mon programme actuel".
export function AnalyserAdaptationButton({ pilierSlug }: { pilierSlug: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultat, setResultat] = useState<ResultatAdaptationUI | null>(null);

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
          <AdaptationResultat resultat={resultat} />
        </div>
      )}
    </div>
  );
}
