// Anneaux de macros (22/08/2026, demande Anthony — direction Whoop /
// Apple Fitness+). Affiche les OBJECTIFS journaliers du programme généré,
// pas une consommation : COAI ne pèse pas les repas et RepasLog n'enregistre
// qu'un statut ("comme prévu", "petit écart", "gros écart"), jamais des
// grammes. Un anneau qui se remplirait au fil de la journée laisserait
// croire à un suivi qui n'existe pas — chaque anneau est donc plein et
// libellé "objectif", ce qui reste vrai.
function extraireNombre(valeur: unknown): { nombre: number | null; texte: string } {
  const texte = String(valeur ?? "").trim();
  const trouve = texte.match(/\d+([.,]\d+)?/);
  return { nombre: trouve ? Number(trouve[0].replace(",", ".")) : null, texte };
}

const CONFIG = [
  { cle: "proteines", label: "Protéines", couleur: "#4cc9f0", emoji: "🍗" },
  { cle: "glucides", label: "Glucides", couleur: "#39e67b", emoji: "🍚" },
  { cle: "lipides", label: "Lipides", couleur: "#ff8a3d", emoji: "🥑" },
] as const;

function Anneau({ label, valeur, couleur, emoji }: { label: string; valeur: string; couleur: string; emoji: string }) {
  const rayon = 46;
  const circonference = 2 * Math.PI * rayon;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="60" cy="60" r={rayon} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
          <circle
            cx="60" cy="60" r={rayon} fill="none" stroke={couleur} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circonference}
            strokeDashoffset={0}
            style={{ filter: `drop-shadow(0 0 6px ${couleur}55)` }}
          />
        </svg>
        <span className="absolute flex flex-col items-center">
          <span aria-hidden="true" className="text-base leading-none">{emoji}</span>
          <span className="mt-1 font-display text-lg font-bold tabular-nums text-white">{valeur}</span>
        </span>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-graphite-400">{label}</span>
    </div>
  );
}

export function AnneauxMacros({ objectifsJournaliers }: { objectifsJournaliers: unknown }) {
  if (typeof objectifsJournaliers !== "object" || objectifsJournaliers === null) return null;
  const objectifs = objectifsJournaliers as Record<string, unknown>;

  const anneaux = CONFIG.map((c) => {
    const { nombre, texte } = extraireNombre(objectifs[c.cle]);
    if (!texte) return null;
    return { ...c, valeur: nombre !== null ? `${nombre}g` : texte };
  }).filter((a): a is NonNullable<typeof a> => a !== null);

  if (anneaux.length === 0) return null;

  const { nombre: calories, texte: caloriesTexte } = extraireNombre(objectifs.calories);

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-5" aria-labelledby="macros-titre">
      <div className="flex items-baseline justify-between gap-3">
        <p id="macros-titre" className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">
          Tes objectifs du jour
        </p>
        {caloriesTexte && (
          <span className="font-display text-lg font-bold tabular-nums text-white">
            {calories !== null ? `${calories} kcal` : caloriesTexte}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-start justify-center gap-6 sm:justify-between">
        {anneaux.map((a) => (
          <Anneau key={a.cle} label={a.label} valeur={a.valeur} couleur={a.couleur} emoji={a.emoji} />
        ))}
      </div>

      <p className="mt-4 border-t border-white/10 pt-3 text-[10px] leading-4 text-graphite-500">
        Cibles calculées pour ton profil — COAI ne pèse pas tes repas, ces anneaux montrent l&apos;objectif, pas ta consommation du jour.
      </p>
    </section>
  );
}
