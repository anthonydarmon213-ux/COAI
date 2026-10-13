import type { PrismaClient } from '@prisma/client';
import { resolveEffectiveAccess } from './effective-access';
import { APPLE_ESSENTIEL_PRODUCT_IDS } from './apple-catalogue';

/** Server-only. userId must come from the authenticated application account.
 * No caching: expiry/refund must be reevaluated for each protected action.
 * Call only after Apple tables are deployed; failures must not grant access.
 */
export async function readEffectiveAccess(
  database: PrismaClient,
  userId: string,
  appleEnvironment: 'Production' | 'Sandbox',
  now = new Date(),
) {
  if (!userId || !Number.isFinite(now.getTime()) ||
      !['Production', 'Sandbox'].includes(appleEnvironment)) throw Error('INVALID_ACCESS_CONTEXT');
  const user = await database.user.findUnique({
    where: { id: userId },
    select: { programmeUnlockedAt: true, subscription: { select: { status: true, plan: true } } },
  });
  if (!user) throw Error('ACCESS_ACCOUNT_NOT_FOUND');
  // Bound the result to one usable record; do not load years of renewal history.
  const apple = await database.appleTransaction.findFirst({
    where: {
      userId, environment: appleEnvironment, productId: { in: [...APPLE_ESSENTIEL_PRODUCT_IDS] },
      purchasedAt: { lte: now }, expiresAt: { gt: now }, revokedAt: null, upgraded: false,
    },
    select: { userId: true, environment: true, productId: true, purchasedAt: true,
      expiresAt: true, revokedAt: true, upgraded: true },
  });
  return resolveEffectiveAccess({ userId, stripe: user.subscription, apple: apple ? [apple] : [],
    appleEnvironment, appleProductIDs: APPLE_ESSENTIEL_PRODUCT_IDS,
    programmeUnlockedAt: user.programmeUnlockedAt, now });
}
