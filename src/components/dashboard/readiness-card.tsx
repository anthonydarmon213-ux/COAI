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

export function ReadinessCard({ readiness }: { readiness: Readiness }) {
  const couleur = COULEUR[readiness.niveau];
  const rayon = 52;
  const circonference = 2 * Math.PI * rayon;

  if (!readiness.disponible) {
    return (
      <section className="coai-glass p-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">Readiness du jour</p>
        <h2 className="mt-2 text-lg font-semibold text-white">{readiness.titre}</h2>
        <p className="mt-1.5 text-xs leading-5 text-graphite-400">{readiness.recommandation}</p>
        <Link
          href="#check-in-du-jour"
          className="mt-3 inline-flex rounded-full border border-laiton-400/35 bg-laiton-400/10 px-4 py-2 text-xs font-semibold text-laiton-200 transition hover:bg-laiton-400/20"
        >
          Faire mon check-in →
        </Link>
      </section>
    );
  }

  return (
    <section className={`rounded-2xl border ${couleur.bord} bg-white/[0.03] p-5`} aria-labelledby="readiness-titre">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">Readiness du jour</p>

      <div className="mt-3 flex items-center gap-4">
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
            <span className={`font-display text-3xl font-bold tabular-nums ${couleur.texte}`}>{readiness.score}</span>
            <span className="font-mono text-[9px] text-graphite-500">/ 100</span>
          </span>
        </div>

        <div className="min-w-0">
          <h2 id="readiness-titre" className="text-base font-semibold text-white">{readiness.titre}</h2>
          <p className="mt-1 text-xs leading-5 text-graphite-400">{readiness.recommandation}</p>
        </div>
      </div>

      {readiness.facteurs.length > 0 && (
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

      <p className="mt-3 text-[10px] leading-4 text-graphite-500">
        Repère de coaching calculé sur ton check-in du jour — pas une mesure médicale.
      </p>
    </section>
  );
}
