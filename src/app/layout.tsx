import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lab Coach",
  description: "Coaching, suivi et IA — la méthode d'Anthony Darmon, accessible au quotidien.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
