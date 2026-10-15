import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/server';
import { prisma } from '@/lib/db/client';
import { getOrCreateAppleAccountToken } from '@/lib/subscription/apple-account';
import { applePurchasesAvailable } from '@/lib/subscription/apple-server-config';
import { readEffectiveAccess } from '@/lib/subscription/read-effective-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie, Authorization' };
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers });

/** Account binding only. Does not sell a product or grant an entitlement.
 * Never accepts a user ID or an account token chosen by the requesting client.
 */
export async function POST(request: Request) {
  const authorization = request.headers.get('authorization');
  if (authorization !== null && !/^Bearer \S+$/.test(authorization)) {
    return json({ error: 'Connexion requise' }, 401);
  }
  const origin = request.headers.get('origin');
  // Use the configured public origin: behind a reverse proxy request.url may
  // carry an internal hostname. Never trust a client-supplied forwarded host.
  const appURL = process.env.NEXT_PUBLIC_APP_URL;
  if (!appURL) return json({ error: 'Service temporairement indisponible' }, 503);
  let appOrigin: string;
  try {
    const configuredURL = new URL(appURL);
    const localHTTP = configuredURL.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(configuredURL.hostname);
    if (configuredURL.protocol !== 'https:' && !localHTTP) {
      return json({ error: 'Service temporairement indisponible' }, 503);
    }
    appOrigin = configuredURL.origin;
  }
  catch { return json({ error: 'Service temporairement indisponible' }, 503); }
  if (origin && origin !== appOrigin) {
    return json({ error: 'Origine non autorisée' }, 403);
  }
  if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') {
    return json({ error: 'Requête JSON requise' }, 415);
  }
  try {
    const authUser = await getCurrentUser();
    if (!authUser) return json({ error: 'Non authentifié' }, 401);
    // Native requests carry a verified bearer token. Cookie requests must
    // originate from COAI before creating the durable StoreKit binding.
    if (authorization === null && origin !== appOrigin) {
      return json({ error: 'Origine non autorisée' }, 403);
    }
    const user = await prisma.user.findUnique({
      where: { supabaseAuthId: authUser.id },
      select: { id: true, subscription: { select: { status: true } } },
    });
    if (!user) return json({ error: 'Profil introuvable' }, 404);
    const environment = process.env.APPLE_STORE_ENVIRONMENT;
    if (process.env.APPLE_CONTENT_ACCESS_ENABLED === 'true' &&
        environment !== 'Production' && environment !== 'Sandbox') {
      // Never report "no existing Apple subscription" when the ledger
      // cannot be read because the deployment is misconfigured.
      return json({ error: 'La vérification de ton abonnement est temporairement indisponible.' }, 503);
    }
    const appAccountToken = await getOrCreateAppleAccountToken(user.id);
    // An active or recoverable Stripe subscription must not lead to a second
    // Apple charge. Apple access is checked from the verified ledger when the
    // purchase service is configured. Missing configuration fails closed.
    const stripeSubscriptionStatus = user.subscription?.status === 'ACTIVE' ||
      user.subscription?.status === 'PAST_DUE' ? user.subscription.status : null;
    let existingSubscription = stripeSubscriptionStatus !== null;
    let appleSubscription: boolean | null = null;
    let purchaseAllowed = false;
    // Existing Apple buyers must still be recognizable when new sales are
    // paused. The content-access switch also guarantees the ledger is deployed.
    if (process.env.APPLE_CONTENT_ACCESS_ENABLED === 'true' &&
        (environment === 'Production' || environment === 'Sandbox')) {
      const access = await readEffectiveAccess(prisma, user.id, environment);
      appleSubscription = access.sources.apple;
      existingSubscription = existingSubscription || access.subscribed;
    }
    purchaseAllowed = applePurchasesAvailable() && !existingSubscription;
    return json({ appAccountToken, existingSubscription, purchaseAllowed,
      stripeSubscriptionStatus, appleSubscription });
  } catch {
    // Do not leak tokens, account details or database errors to clients/logs.
    return json({ error: 'La préparation de ton compte Apple est temporairement indisponible. Réessaie.' }, 503);
  }
}
