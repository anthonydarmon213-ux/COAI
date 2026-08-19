import type { ProjectionEmotionnelle } from "@/lib/diagnostic/projection-emotionnelle";

const ICONE_PAR_EVENEMENT: Record<string, string> = {
  "Un mariage": "💍",
  "Des vacances à la plage": "🏖️",
  "Une compétition ou un événement sportif": "🏆",
  "Être plus performant au travail": "💼",
  "Jouer avec mes enfants sans être essoufflé": "🧒",
  "Me sentir bien avec mon/ma partenaire": "❤️",
};

const SANS_EVENEMENT_PRECIS = "Pas d'événement précis, juste pour moi";

// Graphique projeté façon MyFitCoach (19/08/2026, demande Anthony) : relie
// l'objectif à l'événement émotionnel choisi au quiz, avec une courbe
// réelle (pas une simple phrase) — mais toujours une estimation bornée
// par construireProjection(), jamais un chiffre inventé au hasard.
export function ProjectionEmotionnelleCard({ projection }: { projection: ProjectionEmotionnelle }) {
  const { points, unite, type, depart, arrivee, evenement, semaines, disclaimer } = projection;
  const width = 600;
  const height = 220;
  const paddingX = 14;
  const min = Math.min(...points, depart);
  const max = Math.max(...points, depart);
  const span = max - min || 1;
  const coords = points.map((p, i) => {
    const x = paddingX + (i / (points.length - 1)) * (width - paddingX * 2);
    const y = height - 34 - ((p - min) / span) * (height - 64);
    return [x, y] as const;
  });
  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${path} L${coords[coords.length - 1]![0]},${height - 24} L${coords[0]![0]},${height - 24} Z`;
  const [lastX, lastY] = coords[coords.length - 1]!;
  const [firstX] = coords[0]!;

  const aUnEvenement = Boolean(evenement) && evenement !== SANS_EVENEMENT_PRECIS;
  const icone = aUnEvenement ? ICONE_PAR_EVENEMENT[evenement!] ?? "🎯" : "🎯";
  const evenementMinuscule = evenement ? evenement.charAt(0).toLowerCase() + evenement.slice(1) : "";
  const titreEvenement = aUnEvenement ? `d'ici ${evenementMinuscule}` : `dans les ${semaines} prochaines semaines`;

  return (
    <div className="coai-vitality-panel animate-reveal px-6 py-6 sm:px-8 sm:py-7">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c49a52]">{icone} Ta projection</p>
      <h3 className="mt-2 font-display text-2xl text-white sm:text-3xl">Voici où tu peux être {titreEvenement}.</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-graphite-300">
        {type === "POIDS"
          ? `À ce rythme, ${depart}${unite} aujourd'hui peuvent devenir ${arrivee}${unite} — porté par un programme régulier, jamais un régime extrême.`
          : `À ce rythme, ton Score COAI peut passer de ${depart} à ${arrivee}${unite} avec un suivi régulier.`}
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="img" aria-label="Projection dans le temps">
          <defs>
            <linearGradient id="coai-projection-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9a262" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#c9a262" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#coai-projection-gradient)" stroke="none" />
          <path d={path} fill="none" stroke="#c9a262" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          <line x1={lastX} y1={12} x2={lastX} y2={height - 24} stroke="#c9a262" strokeOpacity={0.35} strokeDasharray="4 4" />
          <circle cx={lastX} cy={lastY} r={5} fill="#c9a262" />
          <text x={firstX} y={height - 8} fontSize="11" fill="#7f898f">Aujourd&apos;hui</text>
          <text x={lastX} y={height - 8} textAnchor="end" fontSize="11" fill="#e0bd77">
            {aUnEvenement ? evenement : `${semaines} sem.`}
          </text>
        </svg>
        <div className="mt-2 flex items-baseline justify-between text-sm">
          <span className="font-mono text-graphite-400">{depart}{unite}</span>
          <span className="font-display text-xl font-semibold text-laiton-200">{arrivee}{unite}</span>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-graphite-500">{disclaimer}</p>
    </div>
  );
}
