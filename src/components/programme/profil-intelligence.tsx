import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import type { ProfilIntelligence } from "@/lib/insight/profil-appris";

export function ProfilIntelligenceSection({ profil }: { profil: ProfilIntelligence }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-laiton-400/20 bg-gradient-to-br from-laiton-400/[0.08] to-transparent p-5 sm:p-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <SectionLabel>Mémoire COAI</SectionLabel>
            <h2 className="mt-2 text-xl font-semibold text-white">COAI apprend avec toi.</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-graphite-400">La mémoire progresse uniquement avec tes données réelles. Une observation n&apos;apparaît jamais avant d&apos;avoir atteint son seuil minimum.</p>
          </div>
          <span className="font-editorial text-4xl text-laiton-200">{profil.progression}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]" aria-label={`Mémoire COAI complétée à ${profil.progression} %`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={profil.progression}>
          <div className="h-full rounded-full bg-gradient-to-r from-laiton-500 to-laiton-200" style={{ width: `${profil.progression}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {profil.axes.map((axe) => (
            <div key={axe.label} className="rounded-xl border border-white/[0.06] bg-black/15 px-3 py-2">
              <p className="text-[10px] text-graphite-500">{axe.label}</p>
              <p className="mt-0.5 text-xs font-medium text-graphite-200">{Math.min(axe.actuel, axe.cible)} / {axe.cible}</p>
            </div>
          ))}
        </div>
      </div>

      <SectionLabel>Ce que COAI apprend sur toi</SectionLabel>
      {profil.items.length === 0 ? (
        <Card className="text-sm leading-6 text-graphite-400">COAI apprend encore à te connaître. Termine quelques séances et check-ins : les premières observations apparaîtront ici avec leur preuve.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profil.items.map((item) => (
            <Card key={item.label} className="flex min-h-36 flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">{item.label}</span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-wide ${item.maturite === "ETABLI" ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200" : "border-laiton-400/20 bg-laiton-400/[0.07] text-laiton-200"}`}>{item.maturite === "ETABLI" ? "Établi" : "En observation"}</span>
              </div>
              <span className="text-base font-semibold text-white">{item.valeur}</span>
              <span className="mt-auto border-t border-white/[0.06] pt-2 text-[10px] leading-4 text-graphite-500">Basé sur : {item.preuve}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
