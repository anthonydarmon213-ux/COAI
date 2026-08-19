import Link from "next/link";
import type { AgeCoaiResultat } from "@/lib/insight/age-coai";
import { AGE_COAI_DISCLAIMER } from "@/lib/insight/age-coai";

// Carte "Score & Âge COAI" façon Whoop (19/08/2026, demande d'Anthony).
// Toujours nourrie par `calculerAgeCoai()` (src/lib/insight/age-coai.ts) —
// jamais de chiffre affiché ici qui ne vienne pas de cette fonction. Tant
// que l'échantillon de check-ins est trop petit ou que l'âge déclaré
// manque, on affiche un état d'attente honnête plutôt qu'un chiffre par
// défaut (même principe que CoaiInsightCard / tendances-longitudinales.ts).
export function ScoreAgeCoaiCard({ resultat }: { resultat: AgeCoaiResultat }) {
  if (!resultat.disponible) {
    return (
      <section className="coai-vitality-panel animate-reveal px-6 py-7 sm:px-8" aria-labelledby="vitality-title">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c49a52]">Score & Âge COAI</p>
        <h2 id="vitality-title" className="mt-2 font-editorial text-2xl sm:text-3xl">
          {resultat.raison === "AGE_MANQUANT"
            ? "Renseigne ton âge pour débloquer l'Âge COAI."
            : "Ton Âge COAI arrive bientôt."}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-graphite-300">
          {resultat.raison === "AGE_MANQUANT"
            ? "Le Score COAI a besoin d'un peu plus de check-ins, et l'Âge COAI compare en plus ta forme réelle à ton âge déclaré."
            : `Encore ${resultat.joursDeSuiviRestants} check-in${resultat.joursDeSuiviRestants > 1 ? "s" : ""} (sommeil, énergie, ressenti) et COAI pourra calculer ton Score et ton Âge à partir de tes vraies données — pas d'une estimation.`}
        </p>
        {resultat.raison === "AGE_MANQUANT" && (
          <Link href="/compte/profil" className="mt-5 inline-flex rounded-full bg-laiton-400 px-6 py-3 text-sm font-semibold text-graphite-950">
            Compléter mon profil
          </Link>
        )}
      </section>
    );
  }

  const ecartLabel =
    resultat.ecartAnnees > 0
      ? `${resultat.ecartAnnees} an${resultat.ecartAnnees > 1 ? "s" : ""} de moins que ton âge réel`
      : resultat.ecartAnnees < 0
        ? `${Math.abs(resultat.ecartAnnees)} an${Math.abs(resultat.ecartAnnees) > 1 ? "s" : ""} de plus que ton âge réel`
        : "aligné sur ton âge réel";

  return (
    <section className="coai-vitality-panel animate-reveal px-6 py-7 sm:px-8" aria-labelledby="vitality-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c49a52]">Score & Âge COAI</p>
        <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-graphite-300">
          {resultat.jours} jours de suivi
        </span>
      </div>
      <h2 id="vitality-title" className="sr-only">Score et âge COAI</h2>

      <div className="mt-5 flex flex-wrap items-center gap-6 sm:gap-9">
        <div className="coai-vitality-ring" style={{ "--coai-vitality-value": `${resultat.score * 3.6}deg` } as React.CSSProperties}>
          <div>
            <strong>{resultat.score}</strong>
            <span>Score COAI</span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <strong className="font-editorial text-5xl leading-none text-[#fffdf8] sm:text-6xl">{resultat.ageCoai}</strong>
            <span className="text-sm font-semibold uppercase tracking-[0.08em] text-graphite-300">ans COAI</span>
          </div>
          <p className={`mt-2 text-sm font-bold ${resultat.ecartAnnees > 0 ? "text-emerald-400" : resultat.ecartAnnees < 0 ? "text-amber-400" : "text-graphite-300"}`}>
            {ecartLabel}
          </p>
          <p className="mt-1 text-xs text-graphite-400">Âge déclaré : {resultat.ageChronologique} ans · Niveau {resultat.niveau.toLowerCase()}</p>
        </div>
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
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-graphite-400">Dosage</span>
        </div>
      </div>

      <p className="mt-5 text-[11px] leading-5 text-graphite-500">{AGE_COAI_DISCLAIMER}</p>
    </section>
  );
}
