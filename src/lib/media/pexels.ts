// Photos Pexels (19/08/2026, demande Anthony — "de belles images", direction
// visuelle façon Whoop/MyFitnessCoach). Appelé uniquement côté serveur : la
// clé ne doit jamais transiter vers le client. Licence Pexels — usage
// commercial libre, aucune attribution obligatoire.
//
// PEXELS_API_KEY absente ou appel en échec (réseau, quota) → retourne null
// partout, jamais une image cassée ni une URL inventée. Les composants
// appelants doivent toujours prévoir un état sans photo.
const PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search";

// Cache mémoire simple (process du serveur Next.js) — une requête par
// recette/query sur toute la durée de vie du serveur plutôt qu'à chaque
// rendu de page, pour ne pas cogner le quota gratuit Pexels à chaque visite.
const cache = new Map<string, string | null>();

export async function getStockPhoto(query: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  if (cache.has(query)) return cache.get(query) ?? null;

  try {
    const res = await fetch(`${PEXELS_SEARCH_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: apiKey },
      // Revalidation longue : une photo de stock associée à une recette/thème
      // n'a aucune raison de changer d'un jour à l'autre.
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) {
      cache.set(query, null);
      return null;
    }
    const data = (await res.json()) as { photos?: { src?: { large?: string; medium?: string } }[] };
    const url = data.photos?.[0]?.src?.large ?? data.photos?.[0]?.src?.medium ?? null;
    cache.set(query, url);
    return url;
  } catch {
    cache.set(query, null);
    return null;
  }
}

// Résout plusieurs requêtes en parallèle sans dépasser le rythme du plan
// gratuit Pexels (200 req/heure) — largement suffisant pour une bibliothèque
// de recettes fixe, chaque résultat étant ensuite mis en cache.
export async function getStockPhotos(queries: string[]): Promise<Record<string, string | null>> {
  const entries = await Promise.all(queries.map(async (q) => [q, await getStockPhoto(q)] as const));
  return Object.fromEntries(entries);
}
