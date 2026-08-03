// Rend le JSON généré dynamiquement par l'IA (structure libre, jamais figée
// d'un pilier ou d'une génération à l'autre) sous une forme lisible, sans
// jamais afficher d'accolades/guillemets bruts à l'utilisateur.

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function humanizeKey(key: string): string {
  const spaced = key.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function JsonView({ data }: { data: unknown }) {
  if (data === null || data === undefined || data === "") return null;

  if (Array.isArray(data)) {
    const allPrimitive = data.every((item) => !isPlainObject(item) && !Array.isArray(item));

    if (allPrimitive) {
      return (
        <ul className="list-inside list-disc space-y-0.5 text-sm text-graphite-200">
          {data.map((item, i) => (
            <li key={i}>{String(item)}</li>
          ))}
        </ul>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {data.map((item, i) => (
          <div key={i} className="rounded-md border border-graphite-800 p-3">
            <JsonView data={item} />
          </div>
        ))}
      </div>
    );
  }

  if (isPlainObject(data)) {
    return (
      <div className="flex flex-col gap-2">
        {Object.entries(data).map(([key, value]) => {
          const label = humanizeKey(key);
          const isComplex = isPlainObject(value) || Array.isArray(value);

          if (isComplex) {
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <span className="font-mono text-xs uppercase tracking-wider text-laiton-500">
                  {label}
                </span>
                <div className="pl-2">
                  <JsonView data={value} />
                </div>
              </div>
            );
          }

          return (
            <div key={key} className="flex flex-wrap gap-1.5 text-sm">
              <span className="text-graphite-400">{label} :</span>
              <span className="text-graphite-50">{String(value)}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="text-sm text-graphite-50">{String(data)}</span>;
}
