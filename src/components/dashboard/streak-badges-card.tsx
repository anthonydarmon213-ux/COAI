import type { Gamification } from "@/lib/insight/gamification";

// Streak + badges (22/08/2026, demande Anthony). Tout vient de
// getGamification(), calculé sur les séances/check-ins réellement
// enregistrés — un badge non obtenu affiche sa progression réelle, jamais
// un compteur décoratif.
export function StreakBadgesCard({ gamification }: { gamification: Gamification }) {
  const { streakJours, actifAujourdhui, meilleurStreak, badges, badgesObtenus } = gamification;

  return (
    <section className="coai-glass p-5" aria-labelledby="gamification-titre">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">Ta série</p>
          <h2 id="gamification-titre" className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold tabular-nums text-white">{streakJours}</span>
            <span className="text-sm text-graphite-300">jour{streakJours > 1 ? "s" : ""} d&apos;affilée</span>
          </h2>
          {streakJours === 0 ? (
            <p className="mt-1 text-xs leading-5 text-graphite-500">
              Une séance ou un check-in aujourd&apos;hui lance ta série.
            </p>
          ) : !actifAujourdhui ? (
            <p className="mt-1 text-xs leading-5 text-[#ffb17d]">
              Ta série tient encore — une activité aujourd&apos;hui et elle continue.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-5 text-emerald-300">
              Journée validée ✓{meilleurStreak > streakJours ? ` · record : ${meilleurStreak} jours` : ""}
            </p>
          )}
        </div>
        <span aria-hidden="true" className={`text-3xl ${streakJours > 0 ? "" : "opacity-30 grayscale"}`}>
          🔥
        </span>
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">Mes hauts faits</p>
          <span className="font-mono text-[10px] tabular-nums text-graphite-500">{badgesObtenus}/{badges.length}</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              title={badge.description}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition ${
                badge.obtenu
                  ? "border-laiton-400/50 bg-laiton-400/[0.1] shadow-[0_0_0_1px_rgba(201,162,98,0.15)]"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <span aria-hidden="true" className={`text-2xl ${badge.obtenu ? "" : "opacity-25 grayscale"}`}>
                {badge.icone}
              </span>
              <span className={`text-[11px] font-semibold leading-tight ${badge.obtenu ? "text-laiton-100" : "text-graphite-500"}`}>
                {badge.nom}
              </span>
              {!badge.obtenu && badge.progression && (
                <span className="font-mono text-[9px] tabular-nums text-graphite-600">
                  {badge.progression.actuel}/{badge.progression.cible}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
