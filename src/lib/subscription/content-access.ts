import type { EffectivePlan } from './plan';
import { prisma } from '@/lib/db/client';
import { resolveEffectiveAccess } from './effective-access';
import { readEffectiveAccess } from './read-effective-access';

/** Content only: never authorizes a paid AI call. Explicit rollout switch
 * prevents querying not-yet-migrated Apple tables on existing deployments.
 * The user snapshot must come from authenticated server lookup, not JSON.
 */
export async function contentAccessFor(user: {
  id: string; programmeUnlockedAt: Date | null;
  subscription: { status: string; plan: EffectivePlan } | null;
}) {
  const baseline = resolveEffectiveAccess({ userId: user.id, stripe: user.subscription,
    programmeUnlockedAt: user.programmeUnlockedAt, apple: [], appleEnvironment: 'Production',
    appleProductIDs: [], now: new Date() });
  if (baseline.subscribed || process.env.APPLE_CONTENT_ACCESS_ENABLED !== 'true') {
    return { ...baseline, appleUnavailable: false };
  }
  const environment = process.env.APPLE_STORE_ENVIRONMENT;
  if (environment !== 'Production' && environment !== 'Sandbox') {
    return { ...baseline, appleUnavailable: true };
  }
  try {
    return { ...await readEffectiveAccess(prisma, user.id, environment), appleUnavailable: false };
  } catch {
    // Preserve previously granted historical access; never fabricate Apple
    // rights on a database/config failure or tell an existing buyer to pay again.
    return { ...baseline, appleUnavailable: true };
  }
}
