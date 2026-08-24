import Link from "next/link";

// Monitoring santé / bracelet connecté (22/08/2026, demande Anthony) —
// affiche les métriques biométriques réellement importées dans le profil,
// via capture de montre (/api/profil/montre) ou synchro Apple Santé.
//
// Aucune valeur n'est simulée : une métrique absente affiche "—" et la
// carte indique quand remonte la dernière synchro. Un dashboard qui
// afficherait des jauges pleines sans données connectées donnerait
// l'illusion d'un suivi inexistant — exactement ce que la marque
// s'interdit.

type Metrique = {
  label: string;
  valeur: number | null;
  unite: string;
  emoji: string;
  couleur: string;
  /** Borne haute servant à remplir la jauge. Repère d'affichage, pas une
   *  cible médicale personnalisée. */
  max: number;
  /** true quand une valeur BASSE est meilleure (fréquence cardiaque). */
  inverse?: boolean;
};

function Jauge({ metrique }: { metrique: Metrique }) {
  const { label, valeur, unite, emoji, couleur, max, inverse } = metrique;
  const ratio = valeur !== null ? Math.max(0.04, Math.min(1, valeur / max)) : 0;
  const remplissage = inverse && valeur !== null ? Math.max(0.04, 1 - ratio) : ratio;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
      <span aria-hidden="true" className="text-base">{emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-graphite-500">{label}</span>
          <span className="font-display text-sm font-bold tabular-nums" style={{ color: valeur !== null ? couleur : "#767c86" }}>
            {valeur !== null ? `${valeur}${unite}` : "—"}
          </span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${remplissage * 100}%`,
              background: valeur !== null ? couleur : "transparent",
              boxShadow: valeur !== null ? `0 0 6px ${couleur}66` : "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function MonitoringSanteCard({
  pasMoyenParJour,
  sommeilMoyenHeures,
  hrv,
  frequenceCardiaqueRepos,
  derniereAnalyseMontre,
}: {
  pasMoyenParJour?: number | null;
  sommeilMoyenHeures?: number | null;
  hrv?: number | null;
  frequenceCardiaqueRepos?: number | null;
  derniereAnalyseMontre?: Date | null;
}) {
  const metriques: Metrique[] = [
    { label: "Pas / jour", valeur: pasMoyenParJour ?? null, unite: "", emoji: "👟", couleur: "#00F0FF", max: 12000 },
    { label: "Sommeil", valeur: sommeilMoyenHeures ?? null, unite: "h", emoji: "🌙", couleur: "#7FAFC3", max: 9 },
    { label: "HRV", valeur: hrv ?? null, unite: "ms", emoji: "💓", couleur: "#39e67b", max: 90 },
    { label: "FC repos", valeur: frequenceCardiaqueRepos ?? null, unite: "bpm", emoji: "❤️", couleur: "#D4AF37", max: 100, inverse: true },
  ];

  const aDesDonnees = metriques.some((m) => m.valeur !== null);

  return (
    <section className="coai-glass p-5" aria-labelledby="monitoring-titre">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">⌚ Monitoring santé</p>
        {derniereAnalyseMontre && (
          <span className="font-mono text-[9px] text-graphite-500">
            {new Date(derniereAnalyseMontre).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>

      {!aDesDonnees ? (
        <>
          <h2 id="monitoring-titre" className="mt-1.5 text-sm font-semibold text-white">
            Connecte ta montre pour affiner ton état du jour.
          </h2>
          <p className="mt-1 text-xs leading-5 text-graphite-400">
            Sommeil, HRV et fréquence cardiaque au repos rendent ton score d&apos;aptitude nettement plus précis.
          </p>
          <Link
            href="/compte/profil#diagnostic-high-tech"
            className="mt-3 inline-flex rounded-full border border-laiton-400/35 bg-laiton-400/10 px-4 py-2 text-xs font-semibold text-laiton-200 transition hover:bg-laiton-400/20"
          >
            Importer mes données →
          </Link>
        </>
      ) : (
        <>
          <h2 id="monitoring-titre" className="sr-only">Tes données biométriques</h2>
          <div className="mt-3 flex flex-col gap-2">
            {metriques.map((m) => (
              <Jauge key={m.label} metrique={m} />
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-4 text-graphite-500">
            Données issues de ta dernière synchro — les métriques non importées affichent « — », jamais une valeur estimée.
          </p>
        </>
      )}
    </section>
  );
}
