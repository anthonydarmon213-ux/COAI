import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AIEconomics } from "@/lib/admin/ai-economics";

const FEATURE_LABELS: Record<string, string> = {
  coach_chat: "Coach IA",
  coach_daily: "Coach en séance",
  coach_whatsapp: "Coach WhatsApp",
  programme_entrainement: "Programme entraînement",
  programme_nutrition: "Programme nutrition",
  programme_recuperation: "Programme récupération",
  adaptation_decision: "Décision d’adaptation",
  vision_montre: "Analyse montre",
  vision_morphologie: "Analyse morphologique",
};

const usd = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export function AIEconomicsPanel({ economics, mrrEur }: { economics: AIEconomics; mrrEur: number }) {
  const mrrSharePercent = mrrEur > 0 ? (economics.costEurEstimate / mrrEur) * 100 : 0;
  const tone = mrrSharePercent >= 20 ? "danger" : mrrSharePercent >= 10 ? "warning" : "success";
  const status = economics.calls === 0 ? "Collecte démarrée" : mrrSharePercent < 10 ? "Coût maîtrisé" : "À surveiller";

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-editorial text-xl text-graphite-50">Économie IA · 30 jours</p>
          <p className="mt-1 text-xs text-graphite-400">Jetons uniquement — aucun prompt ni réponse conservé</p>
        </div>
        <Badge tone={tone}>{status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Appels IA" value={String(economics.calls)} />
        <Metric label="Coût estimé" value={usd.format(economics.costUsd)} />
        <Metric label="Coût / appel" value={usd.format(economics.costPerCallUsd)} />
        <Metric label="Coût / utilisateur" value={usd.format(economics.costPerActiveUserUsd)} />
      </div>

      {economics.byFeature.length > 0 ? (
        <div className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {economics.byFeature.map((item) => (
            <div key={item.feature} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="text-graphite-300">{FEATURE_LABELS[item.feature] ?? item.feature}</span>
              <span className="font-mono text-xs text-graphite-400">{item.calls} appels · {usd.format(item.costUsd)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-graphite-400">
          Les premiers coûts apparaîtront ici après les prochains appels IA.
        </p>
      )}

      <p className="text-xs leading-relaxed text-graphite-500">
        Estimation fondée sur les jetons réellement facturables et les tarifs configurés du modèle. Conversion indicative USD/EUR utilisée uniquement pour le ratio au MRR : {mrrSharePercent.toFixed(2).replace(".", ",")} %.
      </p>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <p className="font-mono text-[9px] uppercase tracking-widest text-graphite-500">{label}</p>
      <p className="mt-1.5 font-mono text-lg text-graphite-100">{value}</p>
    </div>
  );
}
