import type { MetadataRoute } from "next";

// Seules les pages publiques (marketing) ont vocation à être indexées — le
// reste de l'app (dashboard, compte, admin...) est exclu via robots.ts.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://coai.fr";

  const pages: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
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
