import type { ScoreSommeilResultat } from "@/lib/insight/score-sommeil";

const TENDANCE_TEXTE: Record<"hausse" | "stable" | "baisse", string> = {
  hausse: "En progression sur les 7 derniers jours.",
  stable: "Stable sur les 7 derniers jours.",
  baisse: "En baisse sur les 7 derniers jours — à surveiller.",
};

// Score sommeil dédié du pilier Récupération (19/08/2026, demande Anthony :
// "on améliore le sommeil de la personne... avec un score sommeil"). Même
// langage visuel que ScoreAgeCoaiCard (.coai-vitality-panel/-ring) pour
// rester cohérent avec le reste du dashboard, plutôt qu'un nouveau style.
export function ScoreSommeilCard({ resultat }: { resultat: ScoreSommeilResultat }) {
  if (!resultat.disponible) {
    return (
      <section className="coai-vitality-panel animate-reveal px-6 py-6 sm:px-7" aria-labelledby="score-sommeil-title">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c49a52]">🌙 Score sommeil</p>
        <h3 id="score-sommeil-title" className="mt-2 font-display text-xl text-white sm:text-2xl">
          COAI apprend encore ton rythme de sommeil.
        </h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-graphite-300">
          Encore {resultat.joursRestants} check-in{resultat.joursRestants > 1 ? "s" : ""} avec le sommeil renseigné
          et ton score réel apparaîtra ici — calculé sur tes vraies nuits, pas une estimation.
        </p>
        {resultat.conseilDeclare && (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-graphite-200">
            {resultat.conseilDeclare}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="coai-vitality-panel animate-reveal px-6 py-6 sm:px-7" aria-labelledby="score-sommeil-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c49a52]">🌙 Score sommeil</p>
        <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-graphite-300">
          {resultat.jours} nuits suivies
        </span>
      </div>
      <h3 id="score-sommeil-title" className="sr-only">Score de sommeil</h3>

      <div className="mt-5 flex flex-wrap items-center gap-6 sm:gap-9">
        <div className="coai-vitality-ring shrink-0" style={{ "--coai-vitality-value": `${resultat.score * 3.6}deg` } as React.CSSProperties}>
          <div>
            <strong>{resultat.score}</strong>
            <span>Sommeil</span>
          </div>
        </div>
        <div className="max-w-sm">
          <p className="text-sm font-semibold text-[#fffdf8]">{resultat.niveau}</p>
          {resultat.tendance && (
            <p className="mt-1 text-xs leading-5 text-graphite-400">{TENDANCE_TEXTE[resultat.tendance]}</p>
          )}
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-2 border-t border-white/[0.07] pt-5 text-sm leading-6 text-graphite-200">
        {resultat.recommandations.map((r) => (
          <li key={r} className="flex items-start gap-2">
            <span className="mt-0.5 text-laiton-300">✓</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
