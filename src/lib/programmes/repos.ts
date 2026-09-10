/** Durée du repos en secondes ; accepte les anciennes fiches et « 1 min 15 s ».
 * Les fourchettes retiennent leur borne haute. Format incompréhensible : 60 s.
 * Les bornes de sécurité historiques du lecteur (10 s à 10 min) sont conservées.
 */
export function parseReposSeconds(value: unknown): number {
  if (typeof value !== "string") return 60;
  const texte = value.trim().toLowerCase().replace(/,/g, ".");
  if (!texte || /^[−-]/.test(texte)) return 60;
  const uniteImplicite = /min/.test(texte) && !/s(?:ec|econdes?)?\b/.test(texte) ? 60 : 1;
  const bornes = texte.split(/\s*[–—-]\s*|\s+à\s+/);
  const secondes = bornes.map((borne) => {
    const chrono = borne.match(/^(\d+):(\d{2})$/);
    if (chrono) return Number(chrono[1]) * 60 + Number(chrono[2]);
    const unites = [...borne.matchAll(/(\d+(?:\.\d+)?)\s*(minutes?|min|secondes?|sec|s)\b/g)];
    if (unites.length) return unites.reduce((total, match) => total + Number(match[1]) * (match[2]?.startsWith("min") ? 60 : 1), 0);
    return /^\d+(?:\.\d+)?$/.test(borne) ? Number(borne) * uniteImplicite : NaN;
  });
  if (!secondes.length || secondes.some((n) => !Number.isFinite(n))) return 60;
  return Math.min(Math.max(Math.round(Math.max(...secondes)), 10), 600);
}
