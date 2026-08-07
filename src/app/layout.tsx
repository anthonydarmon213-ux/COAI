import type { Metadata } from "next";
import { Playfair_Display, Inter, IBM_Plex_Mono } from "next/font/google";
import "../../sentry.client.config";
import "./globals.css";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";

const playfairDisplay = Playfair_Display({
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${playfairDisplay.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
