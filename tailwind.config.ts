import type { Config } from "tailwindcss";

// Palette de marque Holos : graphite / laiton — ton "labo de performance"
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: "#0d0e10",
          900: "#16181b",
          800: "#212328",
          700: "#2e3138",
          600: "#41454e",
          400: "#6b7078",
          200: "#c7cad0",
          50: "#f5f6f7",
        },
        laiton: {
          600: "#8a6a2f",
          500: "#b0873c",
          400: "#c9a262",
          300: "#ddc191",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
