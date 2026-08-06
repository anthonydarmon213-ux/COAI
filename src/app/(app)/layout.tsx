import { AppNav } from "@/components/app-nav";

// Layout de l'espace abonné. La protection d'accès (auth + abonnement actif)
// est assurée par src/middleware.ts.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-graphite-950 text-graphite-50 md:flex-row">
      <AppNav />
      <div className="mx-auto w-full max-w-3xl px-6 py-10">{children}</div>
    </div>
  );
}
