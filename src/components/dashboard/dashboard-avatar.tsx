import Link from "next/link";
import type { AgeCoaiResultat } from "@/lib/insight/age-coai";

export function DashboardAvatar({ resultat }: { resultat: AgeCoaiResultat }) {
  const age = resultat.disponible && resultat.age.disponible ? resultat.age.ageCoai : null;

  return (
    <Link href="/suivi/progression" className="group flex shrink-0 flex-col items-center gap-2" aria-label={age ? `Âge COAI : ${age} ans. Voir ma progression.` : "Découvrir bientôt mon Âge COAI."}>
      <span className="grid h-24 w-24 place-items-center rounded-full border-[2px] border-cyan-300/65 bg-[#0c1114] shadow-[0_0_30px_rgba(76,201,240,.25),inset_0_0_24px_rgba(201,162,98,.1)] transition group-hover:scale-105">
        <span className="flex flex-col items-center leading-none">
          <strong className="font-editorial text-3xl text-white">{age ?? "—"}</strong>
          {age && <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-200">ans</span>}
        </span>
      </span>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-200">Âge COAI</span>
      <span className="text-center text-[10px] font-semibold text-graphite-300 underline underline-offset-4">{age ? "Voir mon évolution" : "Encore quelques bilans"}</span>
    </Link>
  );
}
