import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  sublabel,
  highlight = false,
}: {
  label: string;
  value: string;
  sublabel?: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-laiton-400/30" : undefined}>
      <span className="font-mono text-[10px] uppercase tracking-widest text-graphite-500">
        {label}
      </span>
      <p
        className={`mt-2 font-mono text-3xl font-semibold ${highlight ? "text-laiton-300" : "text-graphite-50"}`}
      >
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-graphite-400">{sublabel}</p>}
    </Card>
  );
}
