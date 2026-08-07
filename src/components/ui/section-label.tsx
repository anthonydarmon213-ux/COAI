export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-laiton-400 before:h-px before:w-5 before:bg-acier">
      {children}
    </span>
  );
}
