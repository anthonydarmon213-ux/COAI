import { AppNav } from "@/components/app-nav";

// Layout de l'espace abonné. La protection d'accès (auth + abonnement actif)
// est assurée par src/middleware.ts.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-lab-grid flex min-h-screen flex-col text-graphite-50 md:flex-row">
      <AppNav />
      <main className="relative min-w-0 flex-1 overflow-hidden"><div className="pointer-events-none absolute -right-40 -top-48 h-[32rem] w-[32rem] rounded-full bg-laiton-400/[0.06] blur-3xl" /><div className="relative mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12">{children}</div></main>
    </div>
  );
}
