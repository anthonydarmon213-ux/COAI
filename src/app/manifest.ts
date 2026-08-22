import type { MetadataRoute } from "next";

// Manifeste PWA (22/08/2026, demande Anthony) — permet l'installation sur
// l'écran d'accueil et le mode standalone (barre d'adresse masquée).
// `display: "standalone"` est ce qui donne le rendu "app native" ; le fond
// et la couleur de thème reprennent le graphite COAI pour que l'écran de
// démarrage et la barre système restent dans l'identité, jamais un blanc
// par défaut qui casserait le dark mode à l'ouverture.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "COAI — Personal Training, reimagined",
    short_name: "COAI",
    description:
      "Ton Personal Trainer, toujours avec toi : programme adaptatif, check-ins quotidiens et coach IA.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d0e10",
    theme_color: "#0d0e10",
    lang: "fr",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      { src: "/icon-coai.png", sizes: "800x800", type: "image/png", purpose: "any" },
      { src: "/icon-coai.png", sizes: "800x800", type: "image/png", purpose: "maskable" },
    ],
  };
}
