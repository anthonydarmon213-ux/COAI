import type { Config } from "tailwindcss";

// Palette de marque : graphite / laiton — ton "labo de performance"
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // 100/300/500 étaient absents jusqu'ici : les classes text-graphite-*
        // correspondantes ne généraient aucun CSS et le texte héritait d'une
        // couleur imprévisible selon le contexte (cause probable des soucis
        // de lisibilité). Valeurs choisies pour un contraste ≥ 4.5:1 sur le
        // fond quasi-noir (#090a0b) de l'app.
        graphite: {
          950: "#0d0e10",
          900: "#16181b",
          800: "#212328",
          700: "#2e3138",
          600: "#41454e",
          500: "#767c86",
          400: "#8b909a",
          300: "#a9adb5",
          200: "#c7cad0",
          100: "#dee0e4",
          50: "#f5f6f7",
        },
        laiton: {
          600: "#8a6a2f",
          500: "#b0873c",
          400: "#c9a262",
          300: "#ddc191",
        },
        // Bleu-acier du point central du logomark (le repère "IA" du duo
        // humain/IA) — touche d'accent secondaire, utilisée avec parcimonie.
        acier: "#5b8296",
        // Tokens du design system v2 (spécification "Design System — Lab Coach").
        // Additifs : graphite/laiton restent la base déjà en place, brass/steel
        // sont les nouveaux accents (bouton primaire/secondaire), ink/paper/
        // surface/muted/line sont disponibles pour les futurs écrans clairs.
        ink: "#14181A",
        paper: "#EEF1ED",
        surface: "#E3E7E1",
        muted: "#5E6862",
        brass: "#A8763E",
        steel: "#3A5A6B",
        line: "rgba(20,24,26,0.12)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        editorial: ["Georgia", "Times New Roman", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
