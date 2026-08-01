// Layout de l'espace abonné. La protection d'accès (auth + abonnement actif)
// est assurée par src/middleware.ts.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-graphite-950 text-graphite-50">
      <nav className="border-b border-graphite-800 px-6 py-4 text-laiton-400">Lab Coach</nav>
      <div className="px-6 py-8">{children}</div>
    </div>
  );
}
