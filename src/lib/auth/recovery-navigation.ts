import { sanitizeReturnTo } from "./safe-redirect";

export function recoveryHref(
  page: "/sign-in" | "/mot-de-passe-oublie" | "/reinitialiser-mot-de-passe",
  returnTo: string | null,
  completed = false
) {
  const query = new URLSearchParams();
  const safe = sanitizeReturnTo(returnTo);
  if (safe) query.set("redirect_to", safe);
  if (completed) query.set("password_reset", "success");
  return page + (query.size ? `?${query}` : "");
}

export function recoveryError(error: unknown, updating = false): string {
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit") {
    return "Trop de tentatives rapprochées. Patiente quelques minutes avant de réessayer.";
  }
  if (code === "same_password") return "Choisis un mot de passe différent de l’ancien.";
  if (code === "weak_password") return "Choisis un mot de passe plus robuste, avec au moins 8 caractères.";
  return updating
    ? "Impossible de modifier le mot de passe. Vérifie ta connexion ou demande un nouveau lien."
    : "Impossible d’envoyer le lien pour le moment. Vérifie ta connexion et réessaie.";
}
