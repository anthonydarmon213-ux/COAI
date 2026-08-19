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
// recette/exercice/query sur toute la durée de vie du serveur plutôt qu'à
// chaque rendu de page, pour ne pas cogner le quota gratuit Pexels à chaque
// visite. Uniquement les réponses réellement reçues de Pexels (res.ok) sont
// mises en cache — jamais un échec réseau/HTTP, pour ne pas figer "pas de
// photo" pour le reste de la vie du serveur si l'échec était transitoire
// (ex. throttling en rafale, cf. plus bas).
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
    if (!res.ok) return null;
    const data = (await res.json()) as { photos?: { src?: { large?: string; medium?: string } }[] };
    const url = data.photos?.[0]?.src?.large ?? data.photos?.[0]?.src?.medium ?? null;
    cache.set(query, url);
    return url;
  } catch {
    return null;
  }
}

// Résout plusieurs requêtes en respectant une concurrence limitée (19/08/2026,
// corrigé suite au constat d'Anthony : les 10 recettes affichaient bien leur
// photo, les 48 exercices non — la bibliothèque de recettes tirait 10
// requêtes en parallèle via Promise.all sans limite, les exercices 48 d'un
// coup. Pexels applique une limite de requêtes simultanées non documentée ;
// au-delà, les appels excédentaires échouent (429/erreur réseau) et
// getStockPhoto retombe silencieusement sur null — pas de crash, mais pas
// de photo non plus. Traite désormais les requêtes par lots de 6 en
// parallèle plutôt que toutes à la fois.
const CONCURRENCE_MAX = 6;

export async function getStockPhotos(queries: string[]): Promise<Record<string, string | null>> {
  const resultat: Record<string, string | null> = {};
  for (let i = 0; i < queries.length; i += CONCURRENCE_MAX) {
    const lot = queries.slice(i, i + CONCURRENCE_MAX);
    const entries = await Promise.all(lot.map(async (q) => [q, await getStockPhoto(q)] as const));
    for (const [q, url] of entries) resultat[q] = url;
  }
  return resultat;
}
