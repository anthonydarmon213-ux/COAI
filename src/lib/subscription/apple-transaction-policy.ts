/** Apply only AFTER Apple's SignedDataVerifier has verified the JWS.
 * This module is not a signature verifier and does not grant database access.
 */
export type VerifiedAppleTransaction = {
  transactionId?: string;
  originalTransactionId?: string;
  appAccountToken?: string;
  bundleId?: string;
  environment?: string;
  productId?: string;
  type?: string;
  expiresDate?: number;
  revocationDate?: number;
  isUpgraded?: boolean;
};

export function evaluateAppleTransaction(
  transaction: VerifiedAppleTransaction,
  context: { accountToken: string; bundleId: string; environment: 'Production' | 'Sandbox'; productIDs: readonly string[]; now: number },
): { transactionID: string; originalTransactionID: string; active: boolean } {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(context.accountToken) || !transaction.appAccountToken ||
      transaction.appAccountToken.toLowerCase() !== context.accountToken.toLowerCase()) {
    throw new Error('APPLE_ACCOUNT_MISMATCH');
  }
  if (!context.bundleId || transaction.bundleId !== context.bundleId || transaction.environment !== context.environment) {
    throw new Error('APPLE_APPLICATION_MISMATCH');
  }
  if (!transaction.productId || !context.productIDs.includes(transaction.productId) || transaction.type !== 'Auto-Renewable Subscription') {
    throw new Error('APPLE_PRODUCT_NOT_ALLOWED');
  }
  if (!transaction.transactionId || !transaction.originalTransactionId ||
      !Number.isFinite(context.now) || !Number.isFinite(transaction.expiresDate)) {
    throw new Error('APPLE_TRANSACTION_INCOMPLETE');
  }
  return {
    transactionID: transaction.transactionId,
    originalTransactionID: transaction.originalTransactionId,
    active: transaction.expiresDate! > context.now && transaction.revocationDate == null && transaction.isUpgraded !== true,
  };
}
