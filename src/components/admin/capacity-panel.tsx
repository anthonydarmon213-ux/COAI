import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCapacity, type CapacitySnapshot } from "@/lib/admin/capacity";

export function CapacityPanel({ capacity }: { capacity: CapacitySnapshot | null }) {
  if (!capacity) {
    return (
      <Card>
        <p className="text-sm text-graphite-300">Capacité Supabase temporairement indisponible.</p>
      </Card>
    );
  }

  const highest = Math.max(capacity.database.percent, capacity.storage.percent);
  const tone = highest >= 85 ? "danger" : highest >= 60 ? "warning" : "success";
  const verdict = highest >= 85
    ? "Prévoir le passage en Pro"
    : highest >= 60
      ? "Surveiller la croissance"
      : "Supabase Free suffit";

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-editorial text-xl text-graphite-50">Capacité Supabase</p>
          <p className="mt-1 text-xs text-graphite-400">Comparaison avec les quotas du plan Free</p>
        </div>
        <Badge tone={tone}>{verdict}</Badge>
      </div>
      <CapacityRow label="Base de données" item={capacity.database} />
      <CapacityRow label="Photos et fichiers" item={capacity.storage} />
      <p className="text-xs leading-relaxed text-graphite-400">
        Repère COAI : envisager Pro seulement vers 85 % ou si les besoins de sauvegarde le justifient.
      </p>
    </Card>
  );
}

function CapacityRow({ label, item }: { label: string; item: CapacitySnapshot["database"] }) {
  const displayedPercent = item.percent > 0 && item.percent < 0.1 ? "< 0,1" : item.percent.toFixed(1).replace(".", ",");
  const barColor = item.percent >= 85 ? "bg-red-500" : item.percent >= 60 ? "bg-amber-400" : "bg-laiton-400";

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-graphite-200">{label}</span>
        <span className="font-mono text-xs text-graphite-400">
          {formatCapacity(item.usedBytes)} / {formatCapacity(item.limitBytes)} · {displayedPercent} %
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-graphite-800">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.max(item.percent, item.percent > 0 ? 0.5 : 0)}%` }}
        />
      </div>
    </div>
  );
}
