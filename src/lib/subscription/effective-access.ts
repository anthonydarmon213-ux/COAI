import type { EffectivePlan } from './plan';

type AppleAccessRecord = {
  userId: string; environment: string; productId: string;
  purchasedAt: Date; expiresAt: Date; revokedAt: Date | null; upgraded: boolean;
};

/** Server-only access decision from persisted verified records, not client JSON.
 * Never invent Stripe customer IDs for an Apple purchase. Existing Stripe access
 * and historical programme access retain their independent semantics.
 */
export function resolveEffectiveAccess(input: {
  userId: string;
  stripe: { status: string; plan: EffectivePlan } | null;
  apple: readonly AppleAccessRecord[];
  appleEnvironment: 'Production' | 'Sandbox';
  appleProductIDs: readonly string[];
  programmeUnlockedAt: Date | null;
  now: Date;
}) {
  const now = input.now.getTime();
  if (!input.userId || !Number.isFinite(now)) throw Error('INVALID_ACCESS_CONTEXT');
  const appleActive = input.apple.some(record =>
    record.userId === input.userId && record.environment === input.appleEnvironment &&
    input.appleProductIDs.includes(record.productId) && record.revokedAt === null && !record.upgraded &&
    Number.isFinite(record.purchasedAt.getTime()) && record.purchasedAt.getTime() <= now &&
    Number.isFinite(record.expiresAt.getTime()) && record.expiresAt.getTime() > now &&
    record.expiresAt > record.purchasedAt,
  );
  const stripeActive = input.stripe?.status === 'ACTIVE';
  const subscribed = stripeActive || appleActive;
  return {
    subscribed,
    // Apple Essentiel must never downgrade an active Remote/VIP membership.
    plan: stripeActive ? input.stripe!.plan : 'PASS_IA' as EffectivePlan,
    programme: subscribed || input.programmeUnlockedAt !== null,
    catalogue: subscribed,
    suivi: subscribed,
    sources: { stripe: stripeActive, apple: appleActive },
  };
}
