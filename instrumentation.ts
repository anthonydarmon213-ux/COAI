// Point d'entrée Next.js (App Router) pour charger la config Sentry adaptée
// à chaque runtime (Node.js pour le serveur, Edge pour le middleware).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
