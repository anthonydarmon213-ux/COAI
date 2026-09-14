"use client";

/** No account data is rendered until the server has verified access. */
export function AccessRecovery() {
  function verifyAccess() {
    const destination = window.location.pathname + window.location.search;
    window.location.assign(`/completer-inscription?redirect_to=${encodeURIComponent(destination)}`);
  }

  return (
    <section aria-labelledby="access-recovery-title" className="mx-auto flex w-full max-w-lg flex-col gap-5 rounded-2xl border border-white/15 bg-slate-950 p-6 sm:p-8">
      <h1 id="access-recovery-title" className="text-2xl font-semibold text-white">Retrouvons ton espace.</h1>
      <p className="text-sm leading-6 text-graphite-300">
        Nous n’avons pas pu retrouver ton compte pour afficher cette page. Réessaie ; si le problème persiste, vérifie ta connexion pour reprendre là où tu en étais.
      </p>
      <button type="button" onClick={() => window.location.reload()} className="min-h-11 rounded-xl bg-laiton-400 px-5 py-3 font-semibold text-black">Réessayer</button>
      <button type="button" onClick={verifyAccess} className="min-h-11 rounded-xl border border-white/25 px-5 py-3 text-white">Vérifier ma connexion</button>
    </section>
  );
}
