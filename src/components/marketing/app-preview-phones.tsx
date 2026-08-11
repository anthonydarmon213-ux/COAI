import { Badge } from "@/components/ui/badge";

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
      <div className="flex flex-col gap-3 overflow-hidden rounded-[2rem] border border-white/10 bg-[#111214] px-4 pb-5 pt-8">
        {children}
      </div>
    </div>
  );
}

export function AppPreviewPhones({ prenom = "Anthony" }: { prenom?: string }) {
  return (
    <div className="relative flex items-center justify-center">
      <PhoneFrame className="hidden sm:block sm:-mr-16 sm:translate-y-6 sm:rotate-[-4deg]">
        <p className="text-xs text-graphite-400">Bonjour {prenom}</p>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <p className="font-mono text-[9px] uppercase tracking-wider text-graphite-500">
            Ta prochaine séance
          </p>
          <p className="mt-1 text-sm font-semibold text-white">Push — Force</p>
          <p className="mt-1 text-[11px] text-graphite-400">60 min · Renforcement haut du corps</p>
          <div className="mt-3 rounded-full bg-laiton-400 px-3 py-1.5 text-center text-[11px] font-semibold text-graphite-950">
            Commencer la séance
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <p className="text-xs font-medium text-white">Cette semaine</p>
          <p className="mt-1 text-[11px] text-graphite-400">4 / 4 séances réalisées</p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-graphite-800">
            <div className="h-1.5 w-full rounded-full bg-laiton-400" />
          </div>
        </div>
        <div className="rounded-xl border border-laiton-400/20 bg-laiton-400/[0.06] p-3">
          <Badge tone="success">COAI Insight</Badge>
          <p className="mt-2 text-[11px] leading-4 text-graphite-300">
            Tes performances progressent et ta récupération est bonne. Augmentation progressive de
            la charge recommandée.
          </p>
        </div>
      </PhoneFrame>

      <PhoneFrame className="translate-y-2 rotate-[3deg] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)]">
        <p className="text-xs text-graphite-400">Progression</p>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <p className="font-mono text-[9px] uppercase tracking-wider text-graphite-500">
            Développé couché
          </p>
          <p className="mt-1 text-lg font-semibold text-white">102,5 kg</p>
          <p className="mt-0.5 text-[11px] font-medium text-laiton-300">+5,2 kg ce mois-ci</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <p className="font-mono text-[9px] uppercase tracking-wider text-graphite-500">
            Poids du corps
          </p>
          <p className="mt-1 text-sm font-semibold text-white">78,4 kg</p>
          <p className="mt-0.5 text-[11px] text-graphite-400">-1,3 kg</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <p className="text-xs font-medium text-white">Ton programme évolue</p>
          <p className="mt-1 text-[11px] leading-4 text-graphite-400">
            V3 — adapté après ton dernier check-in hebdomadaire.
          </p>
        </div>
      </PhoneFrame>
    </div>
  );
}
