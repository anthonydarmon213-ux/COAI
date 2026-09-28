// Request-scoped acknowledgement, not authentication or a durable legal record.
// Never infer it from an account, subscription, cookie consent or previous tool.
export const AI_IMAGE_CONSENT_HEADER = "x-coai-ai-image-consent";
const VERSION = "anthropic-image-v1";
export type AIImageScope = "morphologie" | "montre" | "mouvement" | "repas" | "menu";
export const AI_IMAGE_CONSENT_ERROR = "Autorise d’abord l’envoi à Anthropic dans cet outil, ou continue sans cette analyse facultative.";

export function aiImageConsentHeaders(scope: AIImageScope, agreed: boolean): Record<string, string> {
  if (!agreed) throw new Error(AI_IMAGE_CONSENT_ERROR);
  return { [AI_IMAGE_CONSENT_HEADER]: `${VERSION}:${scope}` };
}

export function hasAIImageConsent(headers: Headers, scope: AIImageScope): boolean {
  return headers.get(AI_IMAGE_CONSENT_HEADER) === `${VERSION}:${scope}`;
}
