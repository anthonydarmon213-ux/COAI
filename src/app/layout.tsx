import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "../../sentry.client.config";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  applicationName: "CoAI",
  title: "CoAI — HI × AI™",
  description:
    "AI generates. Humans validate. L’expertise humaine augmentée par l’IA.",
  openGraph: {
    title: "CoAI — HI × AI™",
    description: "AI generates. Humans validate. L’expertise humaine augmentée par l’IA.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CoAI — HI × AI™",
    description: "AI generates. Humans validate. L’expertise humaine augmentée par l’IA.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
