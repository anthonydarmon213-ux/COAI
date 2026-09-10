import { sanitizeReturnTo } from "@/lib/auth/safe-redirect";

export type AuthLinkIssue = "confirmation" | "oauth" | "link";

/** Codes seulement : ne jamais afficher error_description fourni dans l'URL. */
export function authLinkIssue(search: string, hash = ""): AuthLinkIssue | null {
  const query = new URLSearchParams(search.replace(/^\?/, ""));
  const fragment = new URLSearchParams(hash.replace(/^#/, ""));
  const code = fragment.get("error_code") ?? query.get("error_code") ?? query.get("error");
  if (code === "otp_expired" || code === "email_not_confirmed") return "confirmation";
  if (code === "oauth" || code === "access_denied") return "oauth";
  if (code === "auth_link" || code === "flow_state_expired" || code === "flow_state_not_found" || code === "bad_code_verifier") return "link";
  return fragment.has("error") || query.has("error") ? "link" : null;
}

export function confirmationCallback(origin: string, returnTo?: string | null): string {
  const callback = new URL("/auth/callback", origin);
  callback.searchParams.set("redirect_to", sanitizeReturnTo(returnTo) ?? "/bienvenue");
  return callback.toString();
}

export function authFailureDestination(origin: string, returnTo: string | null, errorCode?: string): URL {
  const destination = new URL("/sign-in", origin);
  const accepted = ["otp_expired", "email_not_confirmed", "flow_state_expired", "flow_state_not_found", "bad_code_verifier", "oauth"];
  destination.searchParams.set("error", errorCode && accepted.includes(errorCode) ? errorCode : "auth_link");
  const safe = sanitizeReturnTo(returnTo);
  if (safe) destination.searchParams.set("redirect_to", safe);
  return destination;
}

export function confirmationSendError(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit") {
    return "Trop de demandes rapprochées. Patiente quelques minutes avant de réessayer.";
  }
  return "Le lien n’a pas pu être envoyé. Vérifie ta connexion puis réessaie.";
}
