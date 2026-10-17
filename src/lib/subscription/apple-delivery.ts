import type { EvaluatedAppleTransaction } from './apple-transaction-policy';
import type { resolveEffectiveAccess } from './effective-access';

/** Server composition boundary. Dependencies must be server-owned, never
 * supplied by request JSON. Read access from the durable ledger AFTER commit:
 * an older signed receipt may have been superseded by a refund already stored.
 * A read failure deliberately leaves StoreKit unfinished for a safe retry.
 */
export async function deliverAppleTransaction(input: {
  userId: string;
  accountToken: string;
  signedTransaction: string;
}, dependencies: {
  verify: (jws: string, accountToken: string) => Promise<EvaluatedAppleTransaction>;
  persist: (userId: string, facts: EvaluatedAppleTransaction) => Promise<unknown>;
  readAccess: (userId: string) => Promise<ReturnType<typeof resolveEffectiveAccess>>;
}) {
  if (!input.userId || !input.accountToken) throw Error('APPLE_DELIVERY_CONTEXT_REQUIRED');
  const facts = await dependencies.verify(input.signedTransaction, input.accountToken);
  if (facts.accountToken.toLowerCase() !== input.accountToken.toLowerCase()) {
    throw Error('APPLE_DELIVERY_ACCOUNT_MISMATCH');
  }
  await dependencies.persist(input.userId, facts);
  const access = await dependencies.readAccess(input.userId);
  // Expired/revoked deliveries are acknowledged too, without granting access.
  // This prevents a permanently unfinished transaction after a valid refund.
  return {
    transactionID: facts.transactionID,
    accountToken: facts.accountToken,
    persisted: true as const,
    access,
  };
}
