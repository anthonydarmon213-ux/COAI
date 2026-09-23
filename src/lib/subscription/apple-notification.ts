import { createAppleSignedDataVerifier, type AppleVerifierConfig } from './apple-signed-transaction';
import { evaluateAppleTransaction, type EvaluatedAppleTransaction } from './apple-transaction-policy';

const transactionEvents = new Set([
  'SUBSCRIBED', 'DID_RENEW', 'EXPIRED', 'DID_FAIL_TO_RENEW', 'GRACE_PERIOD_EXPIRED',
  'DID_CHANGE_RENEWAL_PREF', 'DID_CHANGE_RENEWAL_STATUS', 'OFFER_REDEEMED',
  'PRICE_INCREASE', 'REFUND', 'REFUND_DECLINED', 'REVOKE', 'REFUND_REVERSED', 'RENEWAL_EXTENDED',
]);

export type VerifiedAppleNotification = {
  notificationID: string;
  facts: EvaluatedAppleTransaction | null;
};

/** Verify BOTH signatures before looking up any account. No unsigned token,
 * user ID, event type, certificate or environment controls persistence.
 */
export function createAppleNotificationVerifier(config: AppleVerifierConfig) {
  const verifier = createAppleSignedDataVerifier(config);
  return async (signedPayload: string, now = Date.now()): Promise<VerifiedAppleNotification> => {
    if (typeof signedPayload !== 'string' || !signedPayload.length || signedPayload.length > 131072) {
      throw Error('APPLE_INVALID_NOTIFICATION');
    }
    const event = await verifier.verifyAndDecodeNotification(signedPayload);
    if (event.version !== '2.0' || !event.notificationUUID ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.notificationUUID)) {
      throw Error('APPLE_NOTIFICATION_INCOMPLETE');
    }
    if (event.notificationType === 'TEST') return { notificationID: event.notificationUUID, facts: null };
    if (!transactionEvents.has(event.notificationType || '')) throw Error('APPLE_NOTIFICATION_UNSUPPORTED');
    const receipt = event.data?.signedTransactionInfo;
    if (!receipt || receipt.length > 65536) throw Error('APPLE_NOTIFICATION_TRANSACTION_REQUIRED');
    const transaction = await verifier.verifyAndDecodeTransaction(receipt);
    const facts = evaluateAppleTransaction(transaction, {
      accountToken: transaction.appAccountToken || '', now, productIDs: config.productIDs,
      bundleId: config.bundleId, environment: config.environment,
    });
    if (['REFUND', 'REVOKE'].includes(event.notificationType!) && facts.revokedAt === null) {
      throw Error('APPLE_REVOCATION_REQUIRED');
    }
    return { notificationID: event.notificationUUID, facts };
  };
}

export async function receiveAppleNotification(signedPayload: string, dependencies: {
  verify: (payload: string) => Promise<VerifiedAppleNotification>;
  findOwner: (verifiedAccountToken: string) => Promise<string | null>;
  persist: (userId: string, facts: EvaluatedAppleTransaction) => Promise<unknown>;
}) {
  const event = await dependencies.verify(signedPayload);
  if (!event.facts) return;
  const userId = await dependencies.findOwner(event.facts.accountToken);
  if (!userId) throw Error('APPLE_NOTIFICATION_ACCOUNT_NOT_FOUND');
  // Ledger uses chain ownership locks, transaction uniqueness and signed dates:
  // duplicate/out-of-order events cannot overwrite newer refund snapshots.
  await dependencies.persist(userId, event.facts);
}
