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
