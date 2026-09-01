import Link from "next/link";
import type { AgeCoaiResultat } from "@/lib/insight/age-coai";

export function DashboardAvatar({ resultat }: { resultat: AgeCoaiResultat }) {
  const age = resultat.disponible && resultat.age.disponible ? resultat.age.ageCoai : null;
  const score = resultat.disponible ? resultat.score : null;
  const bilansRestants = !resultat.disponible ? resultat.joursDeSuiviRestants : 0;
  const valeur = age ?? score;
  const afficheAge = age !== null;
  const libelle = afficheAge ? "Âge COAI" : "Score COAI";
  const unite = afficheAge ? "ans" : score !== null ? "/100" : null;
  const aide = afficheAge
    ? "Voir mon évolution"
    : score !== null
      ? "Faire progresser mon score"
      : `${bilansRestants} bilan${bilansRestants > 1 ? "s" : ""} avant mon score`;

  return (
    <Link
      href="/suivi/progression"
      className="group flex shrink-0 flex-col items-center gap-2"
      aria-label={valeur !== null ? `${libelle} : ${valeur}${afficheAge ? " ans" : " sur 100"}. Voir ma progression.` : aide}
    >
      <span className="grid h-24 w-24 place-items-center rounded-full border-[2px] border-cyan-300/65 bg-[#0c1114] shadow-[0_0_30px_rgba(76,201,240,.25),inset_0_0_24px_rgba(201,162,98,.1)] transition group-hover:scale-105">
        <span className="flex flex-col items-center leading-none">
          <strong className="font-editorial text-3xl text-white">{valeur ?? "—"}</strong>
          {unite && <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-200">{unite}</span>}
        </span>
      </span>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-200">{libelle}</span>
      <span className="max-w-32 text-center text-[10px] font-semibold text-graphite-300 underline underline-offset-4">{aide}</span>
    </Link>
  );
}
