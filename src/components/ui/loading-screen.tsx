// Écran de chargement affiché par Next.js pendant qu'une page Server
// Component récupère ses données — sans ça, l'écran reste figé sur
// l'ancienne page sans aucun retour visuel au clic.
export function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <div className="relative h-12 w-12">
        <svg width="48" height="48" viewBox="0 0 120 120" className="animate-spin-loader">
          <circle
            cx="60"
            cy="60"
            r="42"
            fill="none"
            stroke="#c9a262"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="228 36"
          />
        </svg>
        <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-acier" />
      </div>
      <span className="font-mono text-xs uppercase tracking-widest text-graphite-500">
        Chargement…
      </span>
    </div>
  );
}
