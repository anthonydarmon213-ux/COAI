// Bandeau rouge affiché en tête d'un programme dès qu'il y a des
// contre-indications déclarées par l'IA (à partir des contraintes de
// santé/allergies du profil) — doit rester visible avant tout le reste,
// contrairement aux autres blocs d'info.
export function ContreIndications({ items }: { items?: string[] }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div className="rounded-lg border border-red-500/40 bg-red-500/[0.08] p-3.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-red-400">
        ⚠ Contre-indications
      </span>
      <ul className="mt-1.5 flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-5 text-red-300">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
