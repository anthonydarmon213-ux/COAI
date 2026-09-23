/** Commercial terms explicitly approved on 2026-09-23.
 * Product identifiers are reserved in code, not proof of App Store activation.
 * Prices below are French reference prices for App Store Connect setup only.
 * Customer-facing prices and trial eligibility MUST come from StoreKit.
 * Never use this catalogue alone to grant access or to change Stripe offers.
 */
export const APPLE_ESSENTIEL_CATALOGUE = {
  version: 1,
  plan: 'PASS_IA',
  name: 'COAI Essentiel',
  products: [
    { id: 'fr.coai.mobile.essentiel.monthly', period: 'P1M', francePriceCents: 1999 },
    { id: 'fr.coai.mobile.essentiel.annual', period: 'P1Y', francePriceCents: 11900 },
  ],
  introductoryOffer: { mode: 'freeTrial', period: 'P7D', eligibility: 'storekit' },
} as const;

export const APPLE_ESSENTIEL_PRODUCT_IDS: readonly string[] =
  APPLE_ESSENTIEL_CATALOGUE.products.map(product => product.id);

/** No hardcoded display prices, eligibility, or unlocked rights in the API. */
export function appleClientCatalogue() {
  return {
    version: APPLE_ESSENTIEL_CATALOGUE.version,
    name: APPLE_ESSENTIEL_CATALOGUE.name,
    products: APPLE_ESSENTIEL_CATALOGUE.products.map(({ id, period }) => ({ id, period })),
    introductoryOffer: { ...APPLE_ESSENTIEL_CATALOGUE.introductoryOffer },
  };
}
