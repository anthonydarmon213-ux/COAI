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
  purchaseDate?: number;
  signedDate?: number;
  revocationDate?: number;
  isUpgraded?: boolean;
};

export function evaluateAppleTransaction(
  transaction: VerifiedAppleTransaction,
  context: { accountToken: string; bundleId: string; environment: 'Production' | 'Sandbox'; productIDs: readonly string[]; now: number },
) {
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
      transaction.transactionId.trim() !== transaction.transactionId ||
      transaction.originalTransactionId.trim() !== transaction.originalTransactionId ||
      !validTimestamp(context.now) || !validTimestamp(transaction.expiresDate) ||
      !validTimestamp(transaction.purchaseDate) || !validTimestamp(transaction.signedDate) ||
      transaction.expiresDate! <= transaction.purchaseDate! ||
      (transaction.revocationDate != null && !validTimestamp(transaction.revocationDate)) ||
      (transaction.isUpgraded != null && typeof transaction.isUpgraded !== 'boolean')) {
    throw new Error('APPLE_TRANSACTION_INCOMPLETE');
  }
  return {
    transactionID: transaction.transactionId,
    originalTransactionID: transaction.originalTransactionId,
    // Preserve verified facts for persistence/reconciliation. Never persist only
    // `active`: it changes as time passes without a new notification from Apple.
    accountToken: context.accountToken.toLowerCase(),
    productID: transaction.productId,
    environment: context.environment,
    purchasedAt: transaction.purchaseDate!,
    expiresAt: transaction.expiresDate!,
    signedAt: transaction.signedDate!,
    revokedAt: transaction.revocationDate ?? null,
    upgraded: transaction.isUpgraded === true,
    active: transaction.expiresDate! > context.now && transaction.revocationDate == null && transaction.isUpgraded !== true,
  };
}

function validTimestamp(value: number | undefined): value is number {
  return value !== undefined && Number.isSafeInteger(value) && value >= 0 && value <= 8640000000000000;
}

export type EvaluatedAppleTransaction = ReturnType<typeof evaluateAppleTransaction>;
