// Vérification partagée pour les routes /api/cron/* — Vercel Cron ajoute
// automatiquement un header "Authorization: Bearer <CRON_SECRET>" aux
// requêtes qu'il déclenche dès que cette variable est configurée (cf.
// vercel.json pour la liste des crons).
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
