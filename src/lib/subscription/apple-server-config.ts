import { createAppleTransactionVerifier } from './apple-signed-transaction';
import { APPLE_ESSENTIEL_PRODUCT_IDS } from './apple-catalogue';
import { createAppleNotificationVerifier } from './apple-notification';

/** Trusted deployment configuration only. Never accept roots/environment from
 * an uploaded receipt. Missing configuration keeps the purchase route closed.
 */
function appleVerifierConfiguration() {
  const environment = process.env.APPLE_STORE_ENVIRONMENT;
  if (environment !== 'Production' && environment !== 'Sandbox') throw Error('APPLE_NOT_CONFIGURED');
  const roots: unknown = JSON.parse(process.env.APPLE_ROOT_CERTIFICATES_BASE64_JSON || 'null');
  if (!Array.isArray(roots) || !roots.length || roots.length > 5 ||
      roots.some(root => typeof root !== 'string' || !root.length || root.length > 16384 || !/^[A-Za-z0-9+/]+={0,2}$/.test(root))) {
    throw Error('APPLE_ROOTS_NOT_CONFIGURED');
  }
  return {
      environment, bundleId: 'fr.coai.mobile',
      appAppleId: process.env.APPLE_APP_ID ? Number(process.env.APPLE_APP_ID) : undefined,
      appleRootCertificates: roots.map(root => Buffer.from(root, 'base64')),
      productIDs: APPLE_ESSENTIEL_PRODUCT_IDS,
  } as const;
}

export function appleServerVerifier() {
  const config = appleVerifierConfiguration();
  return { environment: config.environment, verify: createAppleTransactionVerifier(config) };
}

export function appleNotificationServerVerifier() {
  return createAppleNotificationVerifier(appleVerifierConfiguration());
}
