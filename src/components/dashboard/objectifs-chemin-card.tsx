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

const VRAIS_OBJECTIFS = new Set([
  "Perdre du gras",
  "Prendre du muscle",
  "Me sentir mieux au quotidien",
  "Progresser en force",
  "Améliorer mes performances",
  "Gagner en mobilité",
  "Reprendre le sport",
]);

const OBJECTIF_ICONES: Record<string, string> = {
  "Perdre du gras": "flame",
  "Prendre du muscle": "dumbbell",
  "Me sentir mieux au quotidien": "heart",
  "Progresser en force": "zap",
  "Améliorer mes performances": "trending-up",
  "Gagner en mobilité": "activity",
  "Reprendre le sport": "play",
};

const OBJECTIF_COLORS: Record<string, string> = {
  "Perdre du gras": "from-orange-400/20 to-orange-500/5 border-orange-400/25 text-orange-200",
  "Prendre du muscle": "from-violet-400/20 to-violet-500/5 border-violet-400/25 text-violet-200",
  "Me sentir mieux au quotidien": "from-emerald-400/20 to-emerald-500/5 border-emerald-400/25 text-emerald-200",
  "Progresser en force": "from-amber-400/20 to-amber-500/5 border-amber-400/25 text-amber-200",
  "Améliorer mes performances": "from-cyan-400/20 to-cyan-500/5 border-cyan-400/25 text-cyan-200",
  "Gagner en mobilité": "from-teal-400/20 to-teal-500/5 border-teal-400/25 text-teal-200",
  "Reprendre le sport": "from-blue-400/20 to-blue-500/5 border-blue-400/25 text-blue-200",
};

const NIVEAU_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

function extractObjectifs(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const segments = raw.split(/\s+—\s+|\s+–\s+/);
  return segments
    .map((s) => s.trim())
    .filter((s) => VRAIS_OBJECTIFS.has(s));
}

function extractMotivation(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const segments = raw.split(/\s+—\s+|\s+–\s+/);
  for (const s of segments) {
    const trimmed = s.trim();
    if (trimmed.startsWith("objectif précisé : ")) return trimmed.replace("objectif précisé : ", "");
    if (trimmed.startsWith("motivation : ")) return trimmed.replace("motivation : ", "");
  }
  return null;
}

const SVG_ICONS: Record<string, JSX.Element> = {
  flame: <path d="M12 22c-4.97 0-7-3.58-7-7a8 8 0 0 1 3-6c0 2.5 2 3 2 3s-1-2 1-4c2.5 2.5 4 4.5 4 7 0 1-.5 2-1 3 1-1 2-2.5 2-4.5C18 17 16.97 22 12 22Z" />,
  dumbbell: <><path d="M6.5 6.5h11v11h-11z" fill="none" /><path d="M17.5 4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-2 0v-13a1 1 0 0 1 1-1Zm-11 0a1 1 0 0 1 1 1v13a1 1 0 0 1-2 0v-13a1 1 0 0 1 1-1ZM21 8a1 1 0 0 1 1 1v6a1 1 0 0 1-2 0V9a1 1 0 0 1 1-1ZM3 8a1 1 0 0 1 1 1v6a1 1 0 0 1-2 0V9a1 1 0 0 1 1-1Zm5 4h8" /></>,
  heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  "trending-up": <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>,
  activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  play: <polygon points="5 3 19 12 5 21 5 3" />,
};

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
  const objectifs = extractObjectifs(profile?.objectifs);
  const motivation = extractMotivation(profile?.objectifs);
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
      label: "4 séances ce mois",
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
  const doneCount = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((doneCount / steps.length) * 100);

  if (objectifs.length === 0 && !niveau) return null;

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.07]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[#0d1014]" />
      <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-laiton-400/[0.07] blur-[80px]" />
      <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-cyan-400/[0.05] blur-[60px]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle,white_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="relative flex flex-col gap-6 p-6 sm:p-8">
        {/* Objectifs */}
        {objectifs.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-laiton-400/[0.12] backdrop-blur-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-laiton-400">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-laiton-400">
                Tes objectifs
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {objectifs.map((obj) => {
                const iconKey = OBJECTIF_ICONES[obj] ?? "zap";
                const colorClass = OBJECTIF_COLORS[obj] ?? "from-laiton-400/20 to-laiton-500/5 border-laiton-400/25 text-laiton-200";
                return (
                  <div
                    key={obj}
                    className={`flex items-center gap-3 rounded-2xl border bg-gradient-to-r px-4 py-3 backdrop-blur-sm transition-transform hover:scale-[1.02] ${colorClass}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-none opacity-80">
                      {SVG_ICONS[iconKey]}
                    </svg>
                    <span className="text-sm font-semibold">{obj}</span>
                  </div>
                );
              })}
            </div>

            {motivation && (
              <p className="border-l-2 border-laiton-400/30 pl-4 text-sm italic leading-relaxed text-graphite-300">
                &laquo; {motivation} &raquo;
              </p>
            )}
          </div>
        )}

        {/* Niveau & Rythme */}
        {(niveau || frequence) && (
          <div className="flex flex-wrap gap-3">
            {niveau && (
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-graphite-400">
                  <path d="M2 20h.01" /><path d="M7 20v-4" /><path d="M12 20v-8" /><path d="M17 20V8" /><path d="M22 4v16" />
                </svg>
                <span className="text-xs text-graphite-400">Niveau</span>
                <span className="text-sm font-bold text-white">{niveau}</span>
              </div>
            )}
            {frequence && (
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-graphite-400">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span className="text-xs text-graphite-400">Rythme</span>
                <span className="text-sm font-bold text-white">{frequence}</span>
              </div>
            )}
          </div>
        )}

        {/* Chemin COAI */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-400/[0.12] backdrop-blur-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-300">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/80">
                Ton chemin COAI
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-2xl font-black text-white">{progressPercent}</span>
              <span className="font-mono text-[10px] text-graphite-500">%</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-laiton-400 via-amber-300 to-cyan-400 shadow-[0_0_12px_rgba(196,167,107,0.4)] transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-1.5">
            {steps.map((step, i) => {
              const isCurrent = i === currentStepIndex;
              const content = (
                <div
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    isCurrent
                      ? "border border-laiton-400/20 bg-gradient-to-r from-laiton-400/[0.08] to-transparent shadow-[inset_0_1px_0_rgba(196,167,107,0.1)]"
                      : step.done
                        ? "opacity-60 hover:opacity-80"
                        : ""
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                      step.done
                        ? "bg-emerald-500/20 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                        : isCurrent
                          ? "border-2 border-laiton-400/60 bg-laiton-400/10 text-laiton-200 shadow-[0_0_8px_rgba(196,167,107,0.2)]"
                          : "border border-white/10 text-graphite-600"
                    }`}
                  >
                    {step.done ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={`text-[13px] ${
                      step.done
                        ? "text-graphite-400 line-through decoration-graphite-600"
                        : isCurrent
                          ? "font-semibold text-white"
                          : "text-graphite-500"
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && step.href && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-laiton-400 transition-transform group-hover:translate-x-1">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
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

        {/* Stats du mois */}
        {stats.seancesDuMois > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: stats.seancesDuMois, label: "Séances", color: "from-orange-400/15 to-transparent border-orange-400/15" },
              { value: stats.tonnageMoyen > 0 ? `${(stats.tonnageMoyen / 1000).toFixed(1)}t` : "—", label: "Tonnage moy.", color: "from-violet-400/15 to-transparent border-violet-400/15" },
              { value: stats.streakJours, label: "Jours actifs", color: "from-emerald-400/15 to-transparent border-emerald-400/15" },
            ].map((stat) => (
              <div key={stat.label} className={`flex flex-col items-center gap-1 rounded-2xl border bg-gradient-to-b p-3 ${stat.color}`}>
                <span className="font-mono text-xl font-black text-white">{stat.value}</span>
                <span className="font-mono text-[8px] font-bold uppercase tracking-[0.15em] text-graphite-400">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
