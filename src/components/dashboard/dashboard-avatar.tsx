import Link from "next/link";

export function DashboardAvatar({ score }: { score: number }) {
  return (
    <Link href="/suivi/progression" className="group flex shrink-0 flex-col items-center gap-2" aria-label={`Score COAI ${score} sur 100. Voir ma progression.`}>
      <span className="grid h-24 w-24 place-items-center rounded-full border-[7px] border-[#c56cff] bg-[#17191a] shadow-[0_0_30px_rgba(197,108,255,.3)] transition group-hover:scale-105">
        <strong className="text-2xl text-white">{score}</strong>
      </span>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#5d286f]">Score COAI</span>
      <span className="text-[10px] font-semibold text-[#3f4542] underline underline-offset-4">Voir ma progression</span>
    </Link>
  );
}
