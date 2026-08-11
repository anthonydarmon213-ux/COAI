import { Badge } from "@/components/ui/badge";

export type ResultatAdaptationUI = {
  decision: "GARDER" | "PROGRESSER" | "REDUIRE" | "MODIFIER" | "ADAPTER";
  resume: string;
  changements: { cible: string; avant: string | number | null; apres: string | number | null; raison: string }[];
  donneesSuffisantes: boolean;
  nouvelleVersion: number | null;
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
// (weekly-signal-button.tsx). Jamais de changement silencieux : la raison
// de chaque changement est toujours affichée.
export function AdaptationResultat({ resultat }: { resultat: ResultatAdaptationUI }) {
  if (!resultat.donneesSuffisantes) {
    return <p className="text-sm text-graphite-400">{resultat.resume}</p>;
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
      {resultat.nouvelleVersion && (
        <p className="mt-1 text-xs text-laiton-300">
          Nouvelle version (V{resultat.nouvelleVersion}) créée — rafraîchis pour la voir.
        </p>
      )}
    </>
  );
}
