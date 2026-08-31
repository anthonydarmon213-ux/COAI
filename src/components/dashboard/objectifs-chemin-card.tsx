import Link from "next/link";

type ProfileData = {
  objectifs?: string | null;
  niveau?: string | null;
  frequenceEntrainement?: string | null;
  poidsKg?: number | null;
  persona?: string | null;
  contraintesSante?: string | null;
};

type StatsData = {
  seancesDuMois: number;
  tonnageMoyen: number;
  streakJours: number;
};

type Step = {
  label: string;
  done: boolean;
  href?: string;
};

const OBJECTIF_LABELS: Record<string, string> = {
  "Perdre du gras": "Perte de gras",
  "Gagner en muscle": "Prise de muscle",
  "Améliorer ma forme générale": "Forme générale",
  "Gagner en force": "Force",
  "Améliorer ma souplesse": "Souplesse",
  "Me remettre en forme": "Remise en forme",
  "Préparer une compétition": "Compétition",
  "Gérer mon stress": "Gestion du stress",
};

const NIVEAU_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

function getObjectifDisplay(objectifs: string | null | undefined): string[] {
  if (!objectifs) return [];
  return objectifs.split(",").map((o) => {
    const trimmed = o.trim();
    return OBJECTIF_LABELS[trimmed] ?? trimmed;
  }).filter(Boolean);
}

export function ObjectifsCheminCard({
  profile,
  stats,
  hasProgramme,
  hasNutrition,
}: {
  profile: ProfileData | null;
  stats: StatsData;
  hasProgramme: boolean;
  hasNutrition: boolean;
}) {
  const objectifs = getObjectifDisplay(profile?.objectifs);
  const niveau = profile?.niveau ? (NIVEAU_LABELS[profile.niveau.toLowerCase()] ?? profile.niveau) : null;
  const frequence = profile?.frequenceEntrainement ?? null;

  const steps: Step[] = [
    { label: "Diagnostic complété", done: true },
    { label: "Programme généré", done: hasProgramme, href: hasProgramme ? "/programme" : undefined },
    {
      label: "Première séance réalisée",
      done: stats.seancesDuMois > 0,
      href: stats.seancesDuMois > 0 ? "/suivi/seances" : "/programme",
    },
    {
      label: "Nutrition activée",
      done: hasNutrition,
      href: hasNutrition ? "/programme/nutrition" : "/programme/nutrition",
    },
    {
      label: "4 séances cette semaine",
      done: stats.seancesDuMois >= 4,
      href: "/suivi/seances",
    },
    {
      label: "Suivre ma progression",
      done: stats.seancesDuMois >= 8,
      href: "/suivi/progression",
    },
  ];

  const currentStepIndex = steps.findIndex((s) => !s.done);
  const progressPercent = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

  if (objectifs.length === 0 && !niveau) return null;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-[radial-gradient(ellipse_at_top,rgba(76,201,240,.06),transparent_60%),#111518] p-5 sm:p-6">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-laiton-400">
          Tes objectifs
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {objectifs.map((obj) => (
            <span
              key={obj}
              className="rounded-full border border-laiton-400/30 bg-laiton-400/[0.08] px-3 py-1.5 text-xs font-semibold text-laiton-200"
            >
              {obj}
            </span>
          ))}
        </div>
        {(niveau || frequence) && (
          <div className="mt-3 flex gap-4 text-xs text-graphite-400">
            {niveau && (
              <span>
                Niveau : <strong className="text-graphite-200">{niveau}</strong>
              </span>
            )}
            {frequence && (
              <span>
                Rythme : <strong className="text-graphite-200">{frequence}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-4">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">
            Ton chemin COAI
          </p>
          <span className="font-mono text-[10px] text-graphite-500">{progressPercent}%</span>
        </div>

        <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-laiton-400 to-cyan-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex flex-col gap-1">
          {steps.map((step, i) => {
            const isCurrent = i === currentStepIndex;
            const content = (
              <div
                className={`flex items-center gap-3 rounded-lg px-3 py-2 transition ${
                  isCurrent
                    ? "border border-laiton-400/25 bg-laiton-400/[0.06]"
                    : ""
                }`}
              >
                <span
                  className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-bold ${
                    step.done
                      ? "bg-emerald-500/20 text-emerald-300"
                      : isCurrent
                        ? "border border-laiton-400/50 bg-laiton-400/10 text-laiton-200"
                        : "border border-white/10 text-graphite-600"
                  }`}
                >
                  {step.done ? "✓" : i + 1}
                </span>
                <span
                  className={`text-xs ${
                    step.done
                      ? "text-graphite-400 line-through"
                      : isCurrent
                        ? "font-semibold text-graphite-50"
                        : "text-graphite-500"
                  }`}
                >
                  {step.label}
                </span>
                {isCurrent && step.href && (
                  <span className="ml-auto text-[10px] text-laiton-400">→</span>
                )}
              </div>
            );

            return isCurrent && step.href ? (
              <Link key={step.label} href={step.href}>
                {content}
              </Link>
            ) : (
              <div key={step.label}>{content}</div>
            );
          })}
        </div>
      </div>

      {stats.seancesDuMois > 0 && (
        <div className="grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-4">
          <div className="text-center">
            <span className="block font-mono text-lg font-bold text-white">{stats.seancesDuMois}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-graphite-500">séances</span>
          </div>
          <div className="text-center">
            <span className="block font-mono text-lg font-bold text-white">
              {stats.tonnageMoyen > 0 ? `${(stats.tonnageMoyen / 1000).toFixed(1)}t` : "—"}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-graphite-500">tonnage moy.</span>
          </div>
          <div className="text-center">
            <span className="block font-mono text-lg font-bold text-white">{stats.streakJours}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-graphite-500">jours actifs</span>
          </div>
        </div>
      )}
    </div>
  );
}
