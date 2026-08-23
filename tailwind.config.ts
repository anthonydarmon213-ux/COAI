import type { Config } from "tailwindcss";

// Palette de marque : graphite / laiton — ton "labo de performance"
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // 300/400 rapprochés du blanc (au lieu de gris moyen) : ce sont les
        // deux teintes les plus utilisées pour le texte de corps/description
        // dans toute l'app — feedback répété sur la lisibilité du gris sur
        // fond noir. 500 et en dessous restent des gris plus soutenus, pour
        // garder un peu de hiérarchie sur les éléments vraiment secondaires
        // (légendes, mentions).
        graphite: {
          // Bascule charte Dark Luxury (22/08/2026, décision Anthony) :
          // 950 passe de #0d0e10 à #0D0E12, le noir mat de la charte.
          950: "#0D0E12",
          900: "#15171c",
          800: "#212328",
          700: "#2e3138",
          600: "#41454e",
          500: "#767c86",
          400: "#e4e6e8",
          300: "#eef0f1",
          200: "#c7cad0",
          100: "#dee0e4",
          50: "#f5f6f7",
        },
        // Échelle recalée autour de l'or #D4AF37 (22/08/2026, bascule sur
        // la charte Dark Luxury validée par Anthony — remplace le laiton
        // #C9A262 du brand book). Les nuances 200/300 restent claires : ce
        // sont elles qui portent le TEXTE doré, un or saturé y serait
        // illisible sur fond noir.
        laiton: {
          600: "#8a6e1f",
          500: "#b8942c",
          400: "#D4AF37",
          300: "#e3c766",
          // 200 n'existait pas (14/08/2026, corrigé) : "text-laiton-200" est
          // utilisé dans des dizaines de composants sans qu'aucune couleur
          // ne soit jamais générée pour cette classe — le texte héritait
          // silencieusement de la couleur ambiante (blanc sur fond sombre,
          // ce qui passait inaperçu). Sur les nouveaux écrans clairs
          // (diagnostic, app, landing), ce même texte devenait invisible
          // (blanc sur fond clair). Complète la suite au lieu du blanc.
          200: "#f0dca0",
        },
        // Bleu-acier du point central du logomark (le repère "IA" du duo
        // humain/IA) — touche d'accent secondaire, utilisée avec parcimonie.
        // Accent secondaire : cyan néon de la charte, en remplacement du
        // bleu-acier #5B8296. Utilisé sur 27 emplacements existants, qui
        // basculent donc automatiquement.
        acier: "#00F0FF",
        // Tokens du design system v2 (spécification "Design System — Lab Coach").
        // Additifs : graphite/laiton restent la base déjà en place, brass/steel
        // sont les nouveaux accents (bouton primaire/secondaire), ink/paper/
        // surface/muted/line sont disponibles pour les futurs écrans clairs.
        // Accents "high-tech" (22/08/2026, charte Dark Luxury demandée par
        // Anthony) — AJOUTÉS à côté de laiton/acier, jamais à leur place :
        // le brand book COAI définit Laiton #C9A262 et Steel #5B8296 comme
        // couleurs d'identité. Les remplacer par #D4AF37 / #00F0FF aurait
        // changé la marque partout (logo, PDF, e-mails) sans décision
        // explicite. Ces deux teintes servent les surfaces techniques :
        // jauges biométriques, cartographie musculaire, métriques live.
        or: "#D4AF37",
        cyan: "#00F0FF",
        // Fond profond de la charte, très proche du graphite-950 existant
        // (#0d0e10) : conservé distinct pour les écrans immersifs
        // (lecteur de séance) sans toucher au fond global de l'app.
        abysse: "#0D0E12",
        ink: "#14181A",
        paper: "#EEF1ED",
        surface: "#E3E7E1",
        muted: "#5E6862",
        brass: "#A8763E",
        steel: "#3A5A6B",
        line: "rgba(20,24,26,0.12)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        editorial: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
