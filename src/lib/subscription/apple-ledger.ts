import type { PrismaClient } from '@prisma/client';
import type { EvaluatedAppleTransaction } from './apple-transaction-policy';

/** Call ONLY after the official Apple verifier and account/product policy.
 * This persists verified facts, not entitlement delivery acknowledgement.
 * No caller-provided JSON may be cast to EvaluatedAppleTransaction here.
 */
export async function persistVerifiedAppleTransaction(
  database: PrismaClient, userId: string, facts: EvaluatedAppleTransaction,
) {
  return database.$transaction(async tx => {
    // One lock per renewal chain: works across server instances and devices.
    // ReadCommitted ensures queries after waiting see the preceding commit.
    const key = `coai-apple:${facts.environment}:${facts.originalTransactionID}`;
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
    const account = await tx.applePurchaseAccount.findUnique({ where: { userId } });
    if (!account || account.accountToken.toLowerCase() !== facts.accountToken) throw Error('APPLE_ACCOUNT_MISMATCH');
    const owner = await tx.appleTransaction.findFirst({
      where: { environment: facts.environment, originalTransactionId: facts.originalTransactionID },
      select: { userId: true },
    });
    if (owner && owner.userId !== userId) throw Error('APPLE_CHAIN_ALREADY_BOUND');
    const where = { environment_transactionId: { environment: facts.environment, transactionId: facts.transactionID } };
    const previous = await tx.appleTransaction.findUnique({ where });
    if (previous && (previous.userId !== userId || previous.originalTransactionId !== facts.originalTransactionID ||
        previous.productId !== facts.productID || previous.purchasedAt.getTime() !== facts.purchasedAt)) {
      throw Error('APPLE_TRANSACTION_CONFLICT');
    }
    if (previous && previous.signedAt.getTime() > facts.signedAt) return previous;
    const snapshot = {
      expiresAt: new Date(facts.expiresAt), signedAt: new Date(facts.signedAt),
      revokedAt: facts.revokedAt == null ? null : new Date(facts.revokedAt), upgraded: facts.upgraded,
    };
    if (previous && previous.signedAt.getTime() === facts.signedAt) {
      if (previous.expiresAt.getTime() !== facts.expiresAt ||
          (previous.revokedAt?.getTime() ?? null) !== facts.revokedAt || previous.upgraded !== facts.upgraded) {
        throw Error('APPLE_SNAPSHOT_CONFLICT');
      }
      return previous;
    }
    return tx.appleTransaction.upsert({ where,
      create: { ...snapshot, environment: facts.environment, transactionId: facts.transactionID,
        originalTransactionId: facts.originalTransactionID, userId, productId: facts.productID,
        purchasedAt: new Date(facts.purchasedAt) },
      update: snapshot,
    });
  }, { isolationLevel: 'ReadCommitted', maxWait: 10000, timeout: 15000 });
}
