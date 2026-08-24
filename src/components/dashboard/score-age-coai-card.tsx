import Link from "next/link";
import type { AgeCoaiResultat } from "@/lib/insight/age-coai";
import { AGE_COAI_DISCLAIMER } from "@/lib/insight/age-coai";

// Carte "Score & Âge COAI" façon Whoop (19/08/2026, demande d'Anthony).
// Toujours nourrie par `calculerAgeCoai()` (src/lib/insight/age-coai.ts) —
// jamais de chiffre affiché ici qui ne vienne pas de cette fonction.
//
// Score et Âge ont des seuils de disponibilité différents (19/08/2026,
// correction suite au retour direct d'Anthony sur son propre compte : "je
// veux voir mon chiffre je ne vois rien" — le Score restait masqué aussi
// longtemps que l'Âge). Le Score s'affiche dès qu'il est prêt ; l'Âge, plus
// sensible au bruit d'un petit échantillon, garde son propre état d'attente
// affiché à côté plutôt que de bloquer toute la carte.
export function ScoreAgeCoaiCard({ resultat }: { resultat: AgeCoaiResultat }) {
  if (!resultat.disponible) {
    return (
      <section className="coai-vitality-panel animate-reveal px-6 py-7 sm:px-8" aria-labelledby="vitality-title">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c49a52]">Score & Âge COAI</p>
        <h2 id="vitality-title" className="mt-2 font-editorial text-2xl sm:text-3xl">Ton Score COAI arrive bientôt.</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-graphite-300">
          Encore {resultat.joursDeSuiviRestants} bilan{resultat.joursDeSuiviRestants > 1 ? "s" : ""} (sommeil, énergie,
          ressenti) et COAI pourra calculer ton Score à partir de tes vraies données — pas d&apos;une estimation.
        </p>
      </section>
    );
  }

  return (
    <section className="coai-vitality-panel animate-reveal px-6 py-7 sm:px-8" aria-labelledby="vitality-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c49a52]">Score & Âge COAI</p>
        <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-graphite-300">
          {resultat.jours} jours de suivi
        </span>
      </div>
      <h2 id="vitality-title" className="sr-only">Score et âge COAI</h2>
      <p className="mt-3 max-w-xl font-editorial text-lg text-[#fffdf8] sm:text-xl">{resultat.synthese}</p>

      <div className="mt-5 flex flex-wrap items-center gap-6 sm:gap-9">
        <div className="coai-vitality-ring" style={{ "--coai-vitality-value": `${resultat.score * 3.6}deg` } as React.CSSProperties}>
          <div>
            <strong>{resultat.score}</strong>
            <span>Score COAI</span>
          </div>
        </div>

        {resultat.age.disponible ? (
          <AgeBloc age={resultat.age} niveau={resultat.niveau} />
        ) : (
          <div className="max-w-xs">
            <p className="text-sm font-semibold text-[#fffdf8]">Niveau {resultat.niveau.toLowerCase()}</p>
            <p className="mt-2 text-xs leading-5 text-graphite-400">
              {resultat.age.raison === "AGE_MANQUANT"
                ? "Renseigne ton âge pour débloquer l'Âge COAI, qui compare ta forme réelle à ton âge déclaré."
                : `Encore ${resultat.age.joursRestants} bilan${resultat.age.joursRestants > 1 ? "s" : ""} pour débloquer ton Âge COAI.`}
            </p>
            {resultat.age.raison === "AGE_MANQUANT" && (
              <Link href="/compte/profil" className="mt-3 inline-flex rounded-full bg-laiton-400 px-5 py-2 text-xs font-semibold text-graphite-950">
                Compléter mon profil
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5 text-center">
        <div>
          <strong className="block font-display text-lg text-[#fffdf8]">{resultat.composantes.regularite}</strong>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-graphite-400">Régularité</span>
        </div>
        <div>
          <strong className="block font-display text-lg text-[#fffdf8]">{resultat.composantes.recuperation}</strong>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-graphite-400">Récupération</span>
        </div>
        <div>
          <strong className="block font-display text-lg text-[#fffdf8]">{resultat.composantes.dosage}</strong>
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-graphite-400">Équilibre de l&apos;effort</span>
        </div>
      </div>

      <p className="mt-5 text-[11px] leading-5 text-graphite-500">{AGE_COAI_DISCLAIMER}</p>
    </section>
  );
}

function AgeBloc({ age, niveau }: { age: { disponible: true; ageChronologique: number; ageCoai: number; ecartAnnees: number }; niveau: string }) {
  const ecartLabel =
    age.ecartAnnees > 0
      ? `${age.ecartAnnees} an${age.ecartAnnees > 1 ? "s" : ""} de moins que ton âge réel`
      : age.ecartAnnees < 0
        ? `${Math.abs(age.ecartAnnees)} an${Math.abs(age.ecartAnnees) > 1 ? "s" : ""} de plus que ton âge réel`
        : "aligné sur ton âge réel";

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <strong className="font-editorial text-5xl leading-none text-[#fffdf8] sm:text-6xl">{age.ageCoai}</strong>
        <span className="text-sm font-semibold uppercase tracking-[0.08em] text-graphite-300">ans COAI</span>
      </div>
      <p className={`mt-2 text-sm font-bold ${age.ecartAnnees > 0 ? "text-emerald-400" : age.ecartAnnees < 0 ? "text-amber-400" : "text-graphite-300"}`}>
        {ecartLabel}
      </p>
      <p className="mt-1 text-xs text-graphite-400">Âge déclaré : {age.ageChronologique} ans · Niveau {niveau.toLowerCase()}</p>
    </div>
  );
}
