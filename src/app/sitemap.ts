import type { MetadataRoute } from "next";

// Seules les pages publiques (marketing) ont vocation à être indexées — le
// reste de l'app (dashboard, compte, admin...) est exclu via robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.fr";

  const pages: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
    { path: "/diagnostic", priority: 0.9, changeFrequency: "weekly" },
    { path: "/programme-musculation-ia", priority: 0.8, changeFrequency: "monthly" },
    { path: "/coach-sportif-en-ligne", priority: 0.8, changeFrequency: "monthly" },
    { path: "/coaching-nutrition-ia", priority: 0.8, changeFrequency: "monthly" },
    { path: "/coach-sportif-paris", priority: 0.8, changeFrequency: "monthly" },
    { path: "/programme-musculation-femme", priority: 0.8, changeFrequency: "monthly" },
    { path: "/programme-perte-de-poids", priority: 0.8, changeFrequency: "monthly" },
    { path: "/programme-prise-de-masse", priority: 0.8, changeFrequency: "monthly" },
    { path: "/programme-musculation-debutant", priority: 0.8, changeFrequency: "monthly" },
    { path: "/bilan-forme-gratuit", priority: 0.8, changeFrequency: "monthly" },
    { path: "/coach-sportif-ia", priority: 0.8, changeFrequency: "monthly" },
    { path: "/coach-sante-dirigeant", priority: 0.8, changeFrequency: "monthly" },
    { path: "/programme-sport-entrepreneur", priority: 0.8, changeFrequency: "monthly" },
    { path: "/ameliorer-energie-au-travail", priority: 0.8, changeFrequency: "monthly" },
    { path: "/calculateur-calories", priority: 0.7, changeFrequency: "monthly" },
    { path: "/vip", priority: 0.7, changeFrequency: "monthly" },
    { path: "/entreprise", priority: 0.7, changeFrequency: "monthly" },
    { path: "/a-propos", priority: 0.6, changeFrequency: "monthly" },
    { path: "/cgv", priority: 0.3, changeFrequency: "monthly" },
    { path: "/confidentialite", priority: 0.3, changeFrequency: "monthly" },
    { path: "/mentions-legales", priority: 0.3, changeFrequency: "monthly" },
  ];

  return pages.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
