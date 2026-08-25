export function CoaiImageMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/35 bg-black/55 px-2 py-1 backdrop-blur-md ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- petit actif local de marque */}
      <img src="/icon-coai.png" alt="" className="h-3.5 w-3.5 object-contain" />
      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.16em] text-[#E8C875]">
        COAI
      </span>
    </span>
  );
}
