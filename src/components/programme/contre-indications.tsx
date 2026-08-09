// Bandeau rouge affiché en tête d'un programme dès qu'il y a des
// contre-indications déclarées par l'IA (à partir des contraintes de
// santé/allergies du profil) — doit rester visible avant tout le reste,
// contrairement aux autres blocs d'info.
export function ContreIndications({ items }: { items?: string[] }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="rounded-r-lg border-y border-r border-red-500/25 bg-red-500/[0.07] py-3 pl-4 pr-3.5">
      <div className="relative">
        <div className="absolute -left-4 top-0 h-full w-[3px] bg-red-500/70" />
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-red-400">
          Points de vigilance
        </span>
        <ul className="mt-1.5 flex flex-col gap-1">
          {items.map((item, i) => (
            <li key={i} className="text-sm leading-5 text-red-300">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
