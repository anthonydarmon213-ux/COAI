"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ResultatAdaptationUI = {
  decision: "GARDER" | "PROGRESSER" | "REDUIRE" | "MODIFIER" | "ADAPTER";
  resume: string;
  changements: { cible: string; avant: string | number | null; apres: string | number | null; raison: string }[];
  donneesSuffisantes: boolean;
  nouvelleVersion: number | null;
  adaptationId: string | null;
  enAttenteConfirmation: boolean;
};

const DECISION_LABEL: Record<
  ResultatAdaptationUI["decision"],
  { label: string; tone: "neutral" | "success" | "warning" }
> = {
  GARDER: { label: "Programme maintenu", tone: "neutral" },
  PROGRESSER: { label: "Progression", tone: "success" },
  REDUIRE: { label: "Volume réduit", tone: "warning" },
  MODIFIER: { label: "Modification", tone: "success" },
  ADAPTER: { label: "Adaptation ponctuelle", tone: "success" },
};

// Rendu partagé du résultat d'analyse d'adaptation — utilisé par le bouton
// "Analyser mon programme" (pilier-page.tsx) et par "Ma semaine change"
// (semaine-change-button.tsx). Jamais de changement silencieux : la raison
// de chaque changement est toujours affichée. Quand la décision est
// actionnable, rien n'est appliqué tant que l'utilisateur n'a pas cliqué
// "Accepter" — cf. /api/adaptations/[id]/confirmer.
export function AdaptationResultat({ resultat }: { resultat: ResultatAdaptationUI }) {
  const router = useRouter();
  const [statut, setStatut] = useState<"attente" | "accepte" | "rejete">("attente");
  const [loading, setLoading] = useState<"confirmer" | "rejeter" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nouvelleVersion, setNouvelleVersion] = useState<number | null>(resultat.nouvelleVersion);

  if (!resultat.donneesSuffisantes) {
    return <p className="text-sm text-graphite-400">{resultat.resume}</p>;
  }

  async function handleConfirmer() {
    if (!resultat.adaptationId) return;
    setLoading("confirmer");
    setError(null);
    try {
      const res = await fetch(`/api/adaptations/${resultat.adaptationId}/confirmer`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de la confirmation.");
      setNouvelleVersion(data.nouvelleVersion ?? null);
      setStatut("accepte");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(null);
    }
  }

  async function handleRejeter() {
    if (!resultat.adaptationId) return;
    setLoading("rejeter");
    setError(null);
    try {
      const res = await fetch(`/api/adaptations/${resultat.adaptationId}/rejeter`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec.");
      setStatut("rejete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <Badge tone={DECISION_LABEL[resultat.decision].tone}>{DECISION_LABEL[resultat.decision].label}</Badge>
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

      {resultat.enAttenteConfirmation && statut === "attente" && (
        <div className="mt-1 flex flex-wrap gap-2">
          <Button onClick={handleConfirmer} disabled={loading !== null} className="px-4 py-2 text-xs">
            {loading === "confirmer" ? "Application…" : "Accepter"}
          </Button>
          <button
            type="button"
            onClick={handleRejeter}
            disabled={loading !== null}
            className="rounded-full border border-graphite-800 px-4 py-2 text-xs text-graphite-400 transition hover:text-white disabled:opacity-50"
          >
            {loading === "rejeter" ? "…" : "Garder mon programme actuel"}
          </button>
        </div>
      )}

      {statut === "rejete" && (
        <p className="mt-1 text-xs text-graphite-500">Programme inchangé — tu as gardé ta version actuelle.</p>
      )}

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}

      {nouvelleVersion && (
        <p className="mt-1 text-xs text-laiton-300">
          Nouvelle version (V{nouvelleVersion}) créée — rafraîchis pour la voir.
        </p>
      )}
    </>
  );
}
