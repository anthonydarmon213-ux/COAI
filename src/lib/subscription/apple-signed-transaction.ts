import { Environment, SignedDataVerifier } from '@apple/app-store-server-library';
import { evaluateAppleTransaction } from './apple-transaction-policy';

/** Server-only dependency. Roots must be provisioned from Apple's PKI,
 * never taken from a request or the certificate chain in the submitted JWS.
 * No database acknowledgement is returned here: persistence is separate.
 */
export type AppleVerifierConfig = {
  appleRootCertificates: Buffer[];
  bundleId: string;
  environment: 'Production' | 'Sandbox';
  appAppleId?: number;
  productIDs: readonly string[];
};

export function createAppleSignedDataVerifier(config: AppleVerifierConfig) {
  if (!config.appleRootCertificates.length || !config.bundleId.trim() ||
      !config.productIDs.length || config.productIDs.some(id => !id.trim()) ||
      !['Production', 'Sandbox'].includes(config.environment)) {
    throw new Error('APPLE_VERIFIER_NOT_CONFIGURED');
  }
  if (config.environment === 'Production' && (!Number.isSafeInteger(config.appAppleId) || config.appAppleId! <= 0)) {
    throw new Error('APPLE_APP_ID_REQUIRED');
  }
  const environment = config.environment === 'Production' ? Environment.PRODUCTION : Environment.SANDBOX;
  return new SignedDataVerifier(config.appleRootCertificates, true, environment, config.bundleId, config.appAppleId);
}

export function createAppleTransactionVerifier(config: AppleVerifierConfig) {
  const verifier = createAppleSignedDataVerifier(config);
  const productIDs = [...config.productIDs];
  return async (signedTransaction: string, accountToken: string, now = Date.now()) => {
    if (typeof signedTransaction !== 'string' || !signedTransaction.length || signedTransaction.length > 65536) {
      throw new Error('APPLE_INVALID_SIGNED_TRANSACTION');
    }
    const transaction = await verifier.verifyAndDecodeTransaction(signedTransaction);
    return evaluateAppleTransaction(transaction, {
      accountToken, now, productIDs, bundleId: config.bundleId, environment: config.environment,
    });
  };
}
