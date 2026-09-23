import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/db/client';

/** Only call with the user ID obtained from server-side authentication.
 * The UUID is a correlation identifier, NOT authentication or an entitlement.
 * PostgreSQL assigns it once; retries and concurrent requests retain it.
 * Call before a purchase transaction, using the root client: a uniqueness
 * error aborts an interactive PostgreSQL transaction and cannot be read back
 * inside that same transaction.
 */
export async function getOrCreateAppleAccountToken(
  authenticatedUserID: string,
  database: PrismaClient = prisma,
): Promise<string> {
  if (!authenticatedUserID.trim()) throw new Error('APPLE_USER_REQUIRED');
  try {
    const account = await database.applePurchaseAccount.upsert({
      where: { userId: authenticatedUserID },
      create: { userId: authenticatedUserID },
      update: {},
      select: { accountToken: true },
    });
    return account.accountToken;
  } catch (error) {
    // Prisma 5's empty-update upsert may race on the first concurrent insert.
    // Read only this user's winning row; never replace or rotate its token.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      const existing = await database.applePurchaseAccount.findUnique({
        where: { userId: authenticatedUserID }, select: { accountToken: true },
      });
      if (existing) return existing.accountToken;
    }
    throw error;
  }
}
