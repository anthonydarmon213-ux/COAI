import { CoaiMark } from "@/components/brand/coai-mark";

const PREPARATION_STEPS = [
  "Analyse de ton profil",
  "Calcul de ton Score COAI",
  "Préparation de tes recommandations",
];

export default function DiagnosticLoading() {
  return (
    <main className="coai-diagnostic-page flex min-h-screen items-center justify-center px-5 py-10">
      <section className="relative z-10 flex w-full max-w-xl flex-col items-center overflow-hidden rounded-[2rem] border border-laiton-400/25 bg-[rgba(255,253,247,0.94)] px-6 py-12 text-center shadow-[0_30px_90px_rgba(79,63,44,0.16)] backdrop-blur-xl sm:px-12 sm:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-laiton-400/20"
        />

        <div className="relative flex items-center gap-3">
          <div
            aria-hidden="true"
            className="absolute inset-[-0.75rem] animate-pulse rounded-full bg-laiton-400/15 blur-xl"
          />
          <div className="relative">
            <CoaiMark size={52} variant="detailed" animated />
          </div>
          <span className="relative font-display text-2xl font-semibold tracking-[0.2em] text-graphite-950">
            COAI
          </span>
        </div>

        <p className="mt-8 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-laiton-400">
          Ton expérience commence
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-graphite-950 sm:text-4xl">
          Préparation de ton bilan personnalisé.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-graphite-600">
          COAI prépare ton espace pour révéler ton niveau et tes priorités.
        </p>

        <div className="mt-8 flex w-full flex-col gap-2.5">
          {PREPARATION_STEPS.map((step, index) => (
            <div
              key={step}
              className="flex items-center gap-3 rounded-full border border-laiton-400/20 bg-white/70 px-4 py-3 text-left text-sm text-graphite-700"
            >
              <span
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${
                  index === 0
                    ? "animate-pulse bg-laiton-400"
                    : "bg-laiton-400/25"
                }`}
              />
              {step}
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-graphite-500">
          Quelques secondes suffisent.
        </p>
      </section>
    </main>
  );
}
