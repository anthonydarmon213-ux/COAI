"use client";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section aria-labelledby="page-error-title" className="mx-auto flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-white/15 bg-slate-950 p-6 sm:p-8">
      <h1 id="page-error-title" className="text-2xl font-semibold text-white">Cette page n’a pas pu se charger.</h1>
      <p className="text-sm leading-6 text-graphite-300">Un problème temporaire empêche son affichage. Réessaie sans recommencer ton inscription ni ton paiement.</p>
      <button type="button" onClick={reset} className="min-h-11 rounded-xl bg-laiton-400 px-5 py-3 font-semibold text-black">Réessayer</button>
      <a href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-3 text-white">Revenir à mon espace</a>
    </section>
  );
}
