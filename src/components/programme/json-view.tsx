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

// Champs internes générés par l'IA pour résoudre une photo Pexels
// (pilier-page.tsx) — jamais destinés à un affichage brut clé/valeur, que
// ce soit ici ou dans un fallback JsonView (JSON mal formé, champs
// résiduels non destructurés par les vues dédiées).
const CHAMPS_INTERNES = new Set(["photoQuery", "photoQuerySeance", "photoQueryJour"]);

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
          <div key={i} className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3.5">
            <JsonView data={item} typeMedia={typeMedia} />
          </div>
        ))}
      </div>
    );
  }

  if (isPlainObject(data)) {
    return (
      <div className="flex flex-col">
        {Object.entries(data)
          .filter(([key]) => !CHAMPS_INTERNES.has(key))
          .map(([key, value], i, arr) => {
          const label = humanizeKey(key);
          const isComplex = isPlainObject(value) || Array.isArray(value);
          const isLast = i === arr.length - 1;

          if (isComplex) {
            return (
              <div key={key} className="flex flex-col gap-1.5 py-1.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-laiton-500">
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
            <div
              key={key}
              className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 ${
                isLast ? "" : "border-b border-white/[0.06]"
              }`}
            >
              <span className="font-mono text-[10px] uppercase tracking-widest text-graphite-500">
                {label}
              </span>
              <div className="text-right text-sm font-medium text-graphite-50">
                {String(value)}
                {media && typeMedia === "exercice" ? (
                  /* Lien au lieu d'un embed (23/08/2026) : `listType=search`
                     est déprécié par YouTube depuis le 15/11/2020. */
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${String(value)} technique musculation`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto mt-2 inline-flex items-center gap-1.5 rounded-full border border-laiton-400/30 bg-laiton-400/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-laiton-300 transition hover:bg-laiton-400/20"
                  >
                    ▶ Technique
                  </a>
                ) : media ? (
                  <a
                    href={media.searchUrl(value as string)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 font-mono text-[10px] uppercase tracking-wide text-laiton-400 underline decoration-laiton-400/40 hover:text-laiton-300"
                  >
                    {media.label}
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="text-base text-graphite-50">{String(data)}</span>;
}
