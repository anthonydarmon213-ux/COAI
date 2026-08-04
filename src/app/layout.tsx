import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Holos",
  description:
    "Holos — ton coach hybride, holistique. Coaching, suivi et IA, supervisés par Anthony Darmon.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
