// Fiche éducative statique (repères généraux, pas un suivi macro chiffré
// et personnalisé — hors scope V1, décision actée dans le prompt nutrition).
const MACROS = [
  {
    nom: "Protéines",
    role: "Construction et réparation musculaire, satiété.",
    sources: "Viande, poisson, œufs, légumineuses, produits laitiers, tofu.",
    repere: "Repère indicatif pour la pratique sportive : ~1,6 à 2,2 g par kg de poids de corps et par jour.",
  },
  {
    nom: "Glucides",
    role: "Principale source d'énergie, en particulier pour l'effort.",
    sources: "Céréales complètes, riz, pâtes, légumineuses, fruits, légumes.",
    repere: "À moduler selon le volume d'entraînement — plus d'activité, plus de besoin.",
  },
  {
    nom: "Lipides",
    role: "Production hormonale, absorption des vitamines liposolubles.",
    sources: "Huile d'olive, avocat, oléagineux, poissons gras.",
    repere: "Ne pas les éliminer — indispensables même en perte de poids.",
  },
];

export function FicheMacros() {
  return (
    <details className="rounded-md border border-graphite-800 p-3">
      <summary className="cursor-pointer list-none text-sm font-medium text-graphite-50 marker:content-none">
        📋 Fiche d&apos;information — les macronutriments
      </summary>
      <div className="mt-3 flex flex-col gap-3">
        {MACROS.map((macro) => (
          <div key={macro.nom} className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-wider text-laiton-500">
              {macro.nom}
            </span>
            <p className="text-sm text-graphite-200">{macro.role}</p>
            <p className="text-xs text-graphite-400">Sources : {macro.sources}</p>
            <p className="text-xs text-graphite-400">{macro.repere}</p>
          </div>
        ))}
        <p className="text-xs text-graphite-500">
          Repères généraux, pas un suivi macro personnalisé et chiffré — pour un accompagnement
          nutritionnel précis, échange directement avec Anthony.
        </p>
      </div>
    </details>
  );
}
