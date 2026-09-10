// Anti-open-redirect (11/08/2026, amélioration workflow coach) : le
// middleware pose `redirect_to` sur l'URL de /sign-in quand une route
// protégée redirige un visiteur non authentifié (cf. middleware.ts). Cette
// valeur vient de l'URL — jamais faire confiance sans la valider avant de
// naviguer dessus après connexion, sous peine d'open redirect (un lien
// piégé du type /sign-in?redirect_to=https://phishing.example pourrait
// autrement rediriger un utilisateur qui vient de se connecter sur coai.fr
// vers un site tiers).
//
// N'accepte qu'un chemin interne relatif :
// - doit commencer par exactement un "/" (jamais une URL absolue avec
//   protocole, ex: "https://evil.com")
// - jamais "//" ou "/\" en préfixe (URL protocole-relative, ex:
//   "//evil.com" — certains navigateurs la résolvent comme un lien externe)
// - jamais "://" dans la valeur (URL absolue encodée dans le chemin)
export function sanitizeReturnTo(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//") || value.startsWith("/\\")) return null;
  if (value.includes("://")) return null;
  return value;
}

// Ne transmettre à l'inscription que l'intention commerciale reconnue,
// jamais un code de confirmation ni une destination arbitraire.
export function signupHrefForReturnTo(value: string | null | undefined): string {
  const safe = sanitizeReturnTo(value);
  if (!safe) return "/sign-up";
  const destination = new URL(safe, "https://coai.fr");
  if (destination.pathname !== "/pricing" && destination.pathname !== "/bienvenue") return "/sign-up";
  const plan = destination.searchParams.get(destination.pathname === "/pricing" ? "selected" : "plan");
  if (plan !== "PASS_IA" && plan !== "STANDARD" && plan !== "PREMIUM") return "/sign-up";
  const requestedBilling = destination.searchParams.get("billing");
  const billing = requestedBilling === "ANNUAL" || requestedBilling === "QUARTERLY" ? requestedBilling : "MONTHLY";
  const query = new URLSearchParams({ plan, billing });
  const sessions = destination.searchParams.get("vipSessions");
  if (plan === "PREMIUM" && sessions && ["1", "2", "3", "4"].includes(sessions)) query.set("vipSessions", sessions);
  return `/sign-up?${query}`;
}
