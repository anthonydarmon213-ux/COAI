// Infobulle légère (CSS pur, pas de JS) — icône "i" qui affiche `text` au
// survol/focus. Pas de nouvelle dépendance, usage ponctuel (labels courts
// type "Activité quotidienne/NEAT") plutôt qu'un vrai système de tooltip.
export function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-graphite-700 font-mono text-[9px] text-graphite-500 outline-none transition hover:border-laiton-400/50 hover:text-laiton-300 focus:border-laiton-400/50 focus:text-laiton-300"
        aria-label={text}
      >
        i
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg border border-white/[0.08] bg-[#15171a] p-2.5 text-xs leading-5 text-graphite-300 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100">
        {text}
      </span>
    </span>
  );
}
