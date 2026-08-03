import { AppNav } from "@/components/app-nav";

// Layout de l'espace abonné. La protection d'accès (auth + abonnement actif)
// est assurée par src/middleware.ts.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-graphite-950 text-graphite-50">
      <AppNav />
      <div className="mx-auto max-w-3xl px-6 py-10">{children}</div>
    </div>
  );
}
