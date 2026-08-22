import type { Metadata, Viewport } from "next";
import { Manrope, Inter, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "../../sentry.client.config";
import "./globals.css";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { MicrosoftClarity } from "@/components/analytics/microsoft-clarity";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker-registrar";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: "COAI",
  title: "COAI — HI × AI™",
  description:
    "AI generates. Humans validate. L’expertise humaine augmentée par l’IA.",
  openGraph: {
    title: "COAI — HI × AI™",
    description: "AI generates. Humans validate. L’expertise humaine augmentée par l’IA.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "COAI — HI × AI™",
    description: "AI generates. Humans validate. L’expertise humaine augmentée par l’IA.",
  },
  other: {
    google: "notranslate",
  },
  // PWA (22/08/2026) — Next génère /manifest.webmanifest depuis
  // src/app/manifest.ts. appleWebApp active le mode plein écran sur iOS
  // (barre d'adresse masquée) une fois l'app ajoutée à l'écran d'accueil ;
  // "black-translucent" laisse le fond graphite remonter sous la barre
  // d'état plutôt qu'une bande blanche.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "COAI",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon-coai.png",
    apple: "/icon-coai.png",
  },
};

// Barre système alignée sur le thème sombre de l'app, et zoom autorisé —
// bloquer le pinch-to-zoom rendrait l'app inaccessible aux personnes
// malvoyantes, ce qu'aucun gain esthétique ne justifie.
export const viewport: Viewport = {
  themeColor: "#0d0e10",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      translate="no"
      className={`notranslate ${manrope.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <body>
        {children}
        <ServiceWorkerRegistrar />
        <GoogleAnalytics />
        <MetaPixel />
        <MicrosoftClarity />
        <Analytics />
      </body>
    </html>
  );
}
