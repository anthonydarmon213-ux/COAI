import type { MetadataRoute } from "next";

// Autorise l'indexation des pages marketing publiques uniquement — tout
// l'espace applicatif (compte, dashboard, admin, auth, api) reste privé.
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.fr";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/compte",
        "/compte/",
        "/dashboard",
        "/programme",
        "/programme/",
        "/suivi",
        "/suivi/",
        "/coach",
        "/videos",
        "/bienvenue",
        "/admin",
        "/admin/",
        "/sign-in",
        "/sign-up",
        "/login",
        "/inscription",
        "/completer-inscription",
        "/mot-de-passe-oublie",
        "/reinitialiser-mot-de-passe",
        "/auth/",
        "/api/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
