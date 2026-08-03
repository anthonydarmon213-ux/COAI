type Tone = "neutral" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "border-graphite-700 text-graphite-200",
  success: "border-laiton-500 text-laiton-400",
  warning: "border-amber-600 text-amber-400",
  danger: "border-red-700 text-red-400",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs uppercase tracking-wide ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
