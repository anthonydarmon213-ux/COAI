import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "../../sentry.client.config";
import "./globals.css";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { MetaPixel } from "@/components/analytics/meta-pixel";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      translate="no"
      className={`notranslate ${cormorantGaramond.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <body>
        {children}
        <GoogleAnalytics />
        <MetaPixel />
        <Analytics />
      </body>
    </html>
  );
}
