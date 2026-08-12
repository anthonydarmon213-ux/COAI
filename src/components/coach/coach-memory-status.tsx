export function CoachMemoryStatus({ progression, observations, tendances }: { progression: number; observations: number; tendances: number }) {
  const disponible = observations > 0 || tendances > 0;
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-graphite-400">
      <span className="rounded-full border border-laiton-400/20 bg-laiton-400/[0.06] px-3 py-1.5 text-laiton-200">✦ Mémoire COAI · {progression}%</span>
      <span>{disponible ? `${observations} observation${observations > 1 ? "s" : ""} et ${tendances} tendance${tendances > 1 ? "s" : ""} disponibles` : "Le Coach apprend encore à te connaître"}</span>
    </div>
  );
}
