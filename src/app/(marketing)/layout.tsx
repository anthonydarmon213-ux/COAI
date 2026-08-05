import Link from "next/link";

// Barre minimale pour les pages publiques (accueil, pricing) : les pages
// marketing n'ont pas de nav applicative (AppNav), mais un client existant
// doit pouvoir retrouver le chemin vers son compte.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <Link
        href="/sign-in"
        className="fixed right-5 top-5 z-50 font-mono text-xs uppercase tracking-widest text-graphite-400 transition hover:text-laiton-400"
      >
        Se connecter
      </Link>
      {children}
    </div>
  );
}
