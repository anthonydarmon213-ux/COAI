export function normalizeExerciseSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr-FR")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

export function matchesExerciseSearch(text: string, query: string): boolean {
  const haystack = normalizeExerciseSearch(text);
  return normalizeExerciseSearch(query).split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
}
