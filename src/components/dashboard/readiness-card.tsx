import Link from "next/link";
import type { Readiness } from "@/lib/insight/readiness";

// Jauge circulaire "Readiness du jour" (22/08/2026, demande Anthony).
// La couleur de l'arc suit le niveau, jamais un dégradé décoratif : le
// coup d'œil doit transmettre la même information que le texte.
const COULEUR: Record<Readiness["niveau"], { arc: string; texte: string; bord: string }> = {
  ELEVE: { arc: "#39e67b", texte: "text-emerald-300", bord: "border-emerald-500/25" },
  MODERE: { arc: "#c9a262", texte: "text-laiton-200", bord: "border-laiton-400/25" },
  BAS: { arc: "#ff8a3d", texte: "text-[#ffb17d]", bord: "border-[#ff8a3d]/25" },
};

const PASTILLE: Record<"positif" | "neutre" | "negatif", string> = {
  positif: "bg-emerald-400",
  neutre: "bg-laiton-300",
  negatif: "bg-[#ff8a3d]",
};

const NIVEAU_LABEL: Record<Readiness["niveau"], string> = {
  ELEVE: "Prêt",
  MODERE: "À doser",
  BAS: "Alléger",
};

// `compact` (23/08/2026) : version resserrée pour le hero du dashboard —
// anneau + titre uniquement, sans les pastilles de facteurs ni la mention
// de bas de carte, qui restent affichées dans la version pleine.
export function ReadinessCard({ readiness, compact = false }: { readiness: Readiness; compact?: boolean }) {
  const couleur = COULEUR[readiness.niveau];
  const rayon = 52;
  const circonference = 2 * Math.PI * rayon;

  if (!readiness.disponible) {
    return (
      <section className={compact ? "coai-glass flex-none p-4 sm:w-64" : "coai-glass p-5"}>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">État du jour</p>
        <h2 className="mt-2 text-lg font-semibold text-white">{readiness.titre}</h2>
        <p className="mt-1.5 text-xs leading-5 text-graphite-400">{readiness.recommandation}</p>
        <Link
          href="#check-in-du-jour"
          className="mt-3 inline-flex rounded-full border border-laiton-400/35 bg-laiton-400/10 px-4 py-2 text-xs font-semibold text-laiton-200 transition hover:bg-laiton-400/20"
        >
          Faire mon bilan →
        </Link>
      </section>
    );
  }

  return (
    <section
      className={`rounded-2xl border ${couleur.bord} bg-white/[0.03] ${compact ? "flex-none p-4 sm:w-64" : "p-5"}`}
      aria-labelledby="etat-du-jour-titre"
    >
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">État du jour</p>

      <div className={`mt-3 flex gap-4 ${compact ? "flex-col items-center text-center" : "items-center"}`}>
        <div className="relative flex h-28 w-28 flex-none items-center justify-center">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r={rayon} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={rayon} fill="none" stroke={couleur.arc} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circonference}
              strokeDashoffset={circonference * (1 - readiness.score / 100)}
            />
          </svg>
          <span className="absolute flex flex-col items-center">
            <span className={`font-display text-base font-bold ${couleur.texte}`}>{NIVEAU_LABEL[readiness.niveau]}</span>
            <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.1em] text-graphite-500">aujourd’hui</span>
          </span>
        </div>

        <div className="min-w-0">
          <h2 id="etat-du-jour-titre" className="text-base font-semibold text-white">{readiness.titre}</h2>
          <p className="mt-1 text-xs leading-5 text-graphite-400">{readiness.recommandation}</p>
        </div>
      </div>

      {!compact && readiness.facteurs.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-white/10 pt-3">
          {readiness.facteurs.map((facteur) => (
            <span
              key={facteur.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-graphite-300"
            >
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${PASTILLE[facteur.poids]}`} />
              {facteur.label} · {facteur.valeur}
            </span>
          ))}
        </div>
      )}

      {!compact && (
        <p className="mt-3 text-[10px] leading-4 text-graphite-500">
          Repère de coaching calculé sur ton bilan du jour — pas une mesure médicale.
        </p>
      )}
    </section>
  );
}
