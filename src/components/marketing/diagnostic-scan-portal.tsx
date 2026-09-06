const SIGNAUX = [
  { code: "S", label: "Sommeil", couleur: "#67e8f9" },
  { code: "E", label: "Énergie", couleur: "#f3cf78" },
  { code: "M", label: "Mouvement", couleur: "#86efac" },
  { code: "R", label: "Récupération", couleur: "#c4b5fd" },
];

// Première impression du bilan : on montre ce que COAI va relier avant de
// poser la première question. Aucun faux chiffre ni fausse mesure — les
// quatre signaux restent en attente jusqu'aux réponses de l'utilisateur.
export function DiagnosticScanPortal() {
  return (
    <section className="coai-scan-portal w-full max-w-xl" aria-label="Les quatre signaux analysés par le bilan COAI">
      <div className="coai-scan-ambient" aria-hidden="true" />
      <div className="coai-scan-beam" aria-hidden="true" />

      <div className="relative grid items-center gap-5 px-5 py-5 sm:grid-cols-[10rem_1fr] sm:px-7 sm:py-6">
        <div className="coai-scan-core mx-auto" aria-hidden="true">
          <span className="coai-scan-orbit coai-scan-orbit-a" />
          <span className="coai-scan-orbit coai-scan-orbit-b" />
          <span className="coai-scan-crosshair" />
          <span className="coai-scan-core-copy">
            <strong>COAI</strong>
            <small>SCAN</small>
          </span>
        </div>

        <div className="min-w-0 text-left">
          <div className="flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)]" />
            Système prêt · 4 signaux à relier
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {SIGNAUX.map((signal, index) => (
              <div
                key={signal.label}
                className="coai-scan-signal"
                style={{ "--scan-color": signal.couleur, "--scan-delay": `${index * 120}ms` } as React.CSSProperties}
              >
                <span>{signal.code}</span>
                <div>
                  <strong>{signal.label}</strong>
                  <small>En attente</small>
                </div>
              </div>
            ))}
          </div>
          <p className="coai-motion-copy mt-3" aria-live="off">
            <span>Tes habitudes deviennent des signaux.</span>
            <span>Les signaux deviennent une trajectoire.</span>
            <span>La trajectoire devient ton coaching.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
