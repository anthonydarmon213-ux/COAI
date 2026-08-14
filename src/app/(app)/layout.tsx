import { AppNav } from "@/components/app-nav";

// Layout de l'espace abonné. La protection d'accès (auth + abonnement actif)
// est assurée par src/middleware.ts.
//
// Ambiance de fond (14/08/2026, demande Anthony — "ça fait un peu batcave")
// : l'app était visuellement plate à côté du hero marketing, tout en glow
// statique. Réutilise le même langage visuel que le hero (coai-future-ring,
// halo pulsé) plutôt que d'inventer un nouveau style — discret et
// pointer-events-none pour ne jamais gêner le contenu réel (formulaires,
// tableaux) qui reste la priorité de ces pages.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-lab-grid flex min-h-screen flex-col text-graphite-50 md:flex-row">
      <AppNav />
      <main className="relative min-w-0 flex-1 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="animate-pulse-glow absolute -right-40 -top-48 h-[32rem] w-[32rem] rounded-full bg-laiton-400/[0.07] blur-3xl" />
          <div className="absolute -bottom-56 -left-40 h-[30rem] w-[30rem] rounded-full bg-[#4a9fc9]/[0.05] blur-3xl" />
          <div className="coai-future-ring animate-spin-slow absolute left-1/2 top-1/3 h-[48rem] w-[48rem] -translate-x-1/2 opacity-40" />
        </div>
        <div className="relative mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12 lg:px-12">{children}</div>
      </main>
    </div>
  );
}
