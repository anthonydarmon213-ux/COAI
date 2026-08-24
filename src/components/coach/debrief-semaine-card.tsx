import type { DebriefSemaine, PuceDebrief } from "@/lib/insight/debrief-semaine";

// Carte "Débrief de la semaine" (21/08/2026, demande Anthony) — trois
// puces visuelles calculées à partir des séances et check-ins réellement
// enregistrés (cf. getDebriefSemaine). Une puce sans donnée affiche
// explicitement ce qu'il manque pour l'obtenir, jamais un zéro ou une
// valeur par défaut qui ressemblerait à une vraie mesure.
function Puce({
  icone,
  label,
  puce,
  vide,
  accent,
}: {
  icone: string;
  label: string;
  puce: PuceDebrief;
  vide: string;
  accent: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
      <span aria-hidden="true" className="mt-0.5 text-lg">{icone}</span>
      <div className="min-w-0">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-graphite-500">{label}</p>
        {puce ? (
          <>
            <p className={`mt-1 font-display text-xl font-semibold tabular-nums ${accent}`}>{puce.valeur}</p>
            <p className="mt-0.5 text-[11px] leading-4 text-graphite-400">{puce.detail}</p>
          </>
        ) : (
          <p className="mt-1.5 text-[11px] leading-4 text-graphite-500">{vide}</p>
        )}
      </div>
    </div>
  );
}

export function DebriefSemaineCard({ debrief }: { debrief: DebriefSemaine }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6" aria-labelledby="debrief-titre">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">Débrief de la semaine</p>
      <h2 id="debrief-titre" className="mt-1.5 font-editorial text-2xl font-normal tracking-tight text-white">
        {debrief.aDesDonnees ? "Ce que ta semaine raconte." : "Ta semaine commence."}
      </h2>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        <Puce
          icone="🏋️"
          label="Volume validé"
          puce={debrief.volume}
          vide="Aucune séance enregistrée cette semaine pour l'instant."
          accent="text-laiton-200"
        />
        <Puce
          icone="📈"
          label="Progression"
          puce={debrief.progression}
          vide="Il faut le même exercice sur deux semaines pour comparer une charge."
          accent="text-emerald-300"
        />
        <Puce
          icone="🌙"
          label="Récupération"
          puce={debrief.recuperation}
          vide="Fais tes bilans quotidiens pour voir ce score apparaître."
          accent="text-[#7fafc3]"
        />
      </div>

      <p className="mt-3 text-[11px] leading-4 text-graphite-500">
        Calculé à partir de tes séances et bilans réellement enregistrés — pas une estimation.
      </p>
    </section>
  );
}
