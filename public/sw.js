// Service Worker COAI (22/08/2026, demande Anthony — PWA installable).
//
// Volontairement minimal. Un service worker qui met en cache agressivement
// serait dangereux ici : l'app est authentifiée (Supabase), affiche des
// données du jour qui changent en permanence (check-in, séance adaptée,
// readiness) et passe par Stripe. Servir une version en cache pourrait
// montrer la séance d'hier, le profil d'un autre onglet, ou casser un
// paiement en cours.
//
// Ce worker se contente donc de :
//   1. rendre l'app installable (Chrome exige un handler `fetch`),
//   2. mettre en cache les seuls assets statiques et immuables de Next
//      (/_next/static/*, hashés à chaque build donc jamais périmés),
//   3. laisser absolument tout le reste passer au réseau, sans le toucher.

const CACHE = "coai-static-v1";
const STATIC_PREFIX = "/_next/static/";

self.addEventListener("install", () => {
  // Prend la main tout de suite : sans ça, un nouveau worker attend la
  // fermeture de tous les onglets pour s'activer.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Purge les anciennes versions de cache à chaque déploiement.
      const cles = await caches.keys();
      await Promise.all(cles.filter((c) => c !== CACHE).map((c) => caches.delete(c)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const requete = event.request;

  // Jamais autre chose que GET : un POST mis en cache pourrait rejouer un
  // check-in ou un paiement.
  if (requete.method !== "GET") return;

  const url = new URL(requete.url);

  // Même origine uniquement, et uniquement les assets statiques hashés.
  // Tout le reste (pages, /api/*, Stripe, Supabase, Pexels) part au réseau
  // sans interception, exactement comme sans service worker.
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(STATIC_PREFIX)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const enCache = await cache.match(requete);
      if (enCache) return enCache;

      const reponse = await fetch(requete);
      // Seules les réponses complètes et valides sont stockées — jamais une
      // 404 ou une réponse partielle, qui resterait ensuite figée.
      if (reponse.ok && reponse.status === 200) {
        cache.put(requete, reponse.clone());
      }
      return reponse;
    })()
  );
});
