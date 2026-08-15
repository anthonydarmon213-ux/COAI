// Aperçu du produit dans le hero — reconstruit avec les mêmes composants
// et libellés que le vrai dashboard/la vraie page évolution (pas une
// capture d'écran figée, mais pas non plus des fonctionnalités inventées :
// chaque bloc correspond à une carte qui existe réellement dans l'app).
// Données illustratives, jamais présentées comme celles d'un abonné réel.
function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative w-64 rounded-[2.5rem] border border-white/15 bg-[#0b0c0e] p-2.5 shadow-2xl ${className}`}
    >
      <div className="absolute left-1/2 top-2.5 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
      <div className="coai-phone-screen flex min-h-[410px] flex-col gap-3 overflow-hidden rounded-[2rem] px-4 pb-5 pt-8">
        {children}
      </div>
    </div>
  );
}

export function AppPreviewPhones({ prenom = "Anthony" }: { prenom?: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <PhoneFrame className="hidden sm:block sm:-mr-16 sm:translate-y-6 sm:rotate-[-4deg]">
        <div className="flex items-center justify-between">
          <div>
            <p className="coai-phone-kicker">Cockpit COAI</p>
            <p className="coai-phone-heading">Bonjour {prenom}</p>
          </div>
          <span className="coai-phone-status">Prêt</span>
        </div>
        <div className="coai-phone-card p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="coai-phone-label">Séance du jour</p>
              <p className="coai-phone-title mt-1">Push — Force</p>
            </div>
            <span className="coai-phone-score">92</span>
          </div>
          <p className="coai-phone-copy mt-1">60 min · Adaptée à ta forme</p>
          <div className="coai-phone-action mt-3">
            Commencer la séance
          </div>
        </div>
        <div className="coai-phone-card p-3">
          <div className="flex items-center justify-between">
            <p className="coai-phone-title">Ta semaine</p>
            <p className="coai-phone-accent">4 / 4</p>
          </div>
          <div className="coai-phone-progress mt-2">
            <div className="h-full w-full rounded-full bg-[#cba45f]" />
          </div>
        </div>
        <div className="coai-phone-insight p-3">
          <p className="coai-phone-label">✦ Insight COAI</p>
          <p className="coai-phone-copy mt-2 leading-4">
            Ta récupération est bonne. Ton programme peut progresser en toute sécurité.
          </p>
        </div>
      </PhoneFrame>

      <PhoneFrame className="translate-y-2 rotate-[3deg] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="coai-phone-kicker">Ton évolution</p>
            <p className="coai-phone-heading">Progression</p>
          </div>
          <div className="coai-phone-orb" aria-hidden="true"><span>87</span></div>
        </div>
        <div className="coai-phone-card p-3">
          <p className="coai-phone-label">Développé couché</p>
          <div className="mt-1 flex items-end justify-between">
            <p className="coai-phone-metric">102,5 <span>kg</span></p>
            <p className="coai-phone-accent">+5,2 kg</p>
          </div>
          <svg className="mt-3 h-9 w-full" viewBox="0 0 180 36" fill="none" aria-hidden="true">
            <path d="M2 31C24 28 35 29 51 22C68 15 78 21 96 16C113 11 126 13 144 7C157 3 168 6 178 2" stroke="#c29a54" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M2 31C24 28 35 29 51 22C68 15 78 21 96 16C113 11 126 13 144 7C157 3 168 6 178 2V36H2Z" fill="url(#phoneChart)" opacity=".32" />
            <defs><linearGradient id="phoneChart" x1="90" y1="0" x2="90" y2="36"><stop stopColor="#c29a54"/><stop offset="1" stopColor="#c29a54" stopOpacity="0"/></linearGradient></defs>
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="coai-phone-card p-3">
            <p className="coai-phone-label">Énergie</p>
            <p className="coai-phone-title mt-1">8 / 10</p>
          </div>
          <div className="coai-phone-card p-3">
            <p className="coai-phone-label">Régularité</p>
            <p className="coai-phone-title mt-1">94%</p>
          </div>
        </div>
        <div className="coai-phone-insight p-3">
          <p className="coai-phone-label">Programme V3 · Aujourd&apos;hui</p>
          <p className="coai-phone-copy mt-1 leading-4">
            Ajusté après ton check-in : volume maintenu, charge progressive.
          </p>
        </div>
      </PhoneFrame>
    </div>
  );
}
