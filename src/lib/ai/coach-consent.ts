// Per-request acknowledgement, not authentication or a durable legal record.
export const AI_COACH_CONSENT_HEADER = "x-coai-ai-coach-consent";
const VERSION = "anthropic-coach-v1";
export const AI_COACH_CONSENT_ERROR = "Autorise d’abord le partage avec Anthropic pour utiliser le coach IA. Tu peux continuer ta séance sans cet outil.";

export function aiCoachConsentHeaders(agreed: boolean): Record<string, string> {
  if (!agreed) throw new Error(AI_COACH_CONSENT_ERROR);
  return { [AI_COACH_CONSENT_HEADER]: VERSION };
}

export function hasAICoachConsent(headers: Headers): boolean {
  return headers.get(AI_COACH_CONSENT_HEADER) === VERSION;
}
