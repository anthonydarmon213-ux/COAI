// Rend le JSON généré dynamiquement par l'IA (structure libre, jamais figée
// d'un pilier ou d'une génération à l'autre) sous une forme lisible, sans
// jamais afficher d'accolades/guillemets bruts à l'utilisateur.

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Les clés générées par l'IA sont en camelCase sans accents (JSON) — pour les
// champs qu'on impose nous-mêmes dans les prompts, on connaît le libellé
// français correct. Le reste (clés libres générées par l'IA) passe par
// l'humanisation générique ci-dessous.
const KNOWN_LABELS: Record<string, string> = {
  frequenceParSemaine: "Fréquence par semaine",
  vueEnsemble: "Vue d'ensemble",
  retourAuCalme: "Retour au calme",
  dureeProgramme: "Durée du programme",
  objectifsJournaliers: "Objectifs journaliers",
  quantite: "Quantité",
  mobiliteEtirements: "Mobilité / étirements",
  gestionFatigue: "Gestion de la fatigue",
  constatActuel: "Constat actuel",
  proteines: "Protéines",
  lipides: "Lipides",
};

function humanizeKey(key: string): string {
  if (KNOWN_LABELS[key]) return KNOWN_LABELS[key];
  const spaced = key.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

type TypeMedia = "exercice" | "repas";

// Pas de bibliothèque de photos/vidéos maison (programmes générés
// dynamiquement, jamais de contenu pré-construit — décision actée). À la
// place, un lien de recherche ciblé sur le nom exact généré par l'IA.
const MEDIA_CONFIG: Record<
  TypeMedia,
  { label: string; searchUrl: (nom: string) => string }
> = {
  exercice: {
    label: "▶ Voir la technique",
    searchUrl: (nom) =>
      `https://www.youtube.com/results?search_query=${encodeURIComponent(`${nom} technique musculation`)}`,
  },
  repas: {
    label: "📷 Voir en photo",
    searchUrl: (nom) =>
      `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${nom} recette`)}`,
  },
};

export function JsonView({
  data,
  typeMedia,
}: {
  data: unknown;
  typeMedia?: TypeMedia;
}) {
  if (data === null || data === undefined || data === "") return null;

  if (Array.isArray(data)) {
    const allPrimitive = data.every((item) => !isPlainObject(item) && !Array.isArray(item));

    if (allPrimitive) {
      return (
        <ul className="list-inside list-disc space-y-1 text-base leading-relaxed text-graphite-200">
          {data.map((item, i) => (
            <li key={i}>{String(item)}</li>
          ))}
        </ul>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {data.map((item, i) => (
          <div key={i} className="rounded-md border border-graphite-800 p-3">
            <JsonView data={item} typeMedia={typeMedia} />
          </div>
        ))}
      </div>
    );
  }

  if (isPlainObject(data)) {
    return (
      <div className="flex flex-col gap-2">
        {Object.entries(data).map(([key, value]) => {
          const label = humanizeKey(key);
          const isComplex = isPlainObject(value) || Array.isArray(value);

          if (isComplex) {
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <span className="font-mono text-xs uppercase tracking-wider text-laiton-500">
                  {label}
                </span>
                <div className="pl-2">
                  <JsonView data={value} typeMedia={typeMedia} />
                </div>
              </div>
            );
          }

          const media =
            typeMedia && key.toLowerCase() === "nom" && typeof value === "string"
              ? MEDIA_CONFIG[typeMedia]
              : null;

          return (
            <div key={key} className="flex flex-wrap items-center gap-2 text-base leading-relaxed">
              <span className="font-medium text-graphite-200">{label} :</span>
              <span className="text-graphite-50">{String(value)}</span>
              {media && (
                <a
                  href={media.searchUrl(value as string)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-laiton-400 underline hover:text-laiton-300"
                >
                  {media.label}
                </a>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="text-base text-graphite-50">{String(data)}</span>;
}
