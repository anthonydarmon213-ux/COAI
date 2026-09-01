import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, Camera, ClipboardCheck, LockKeyhole } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type DashboardFeaturesCardProps = {
  hasPaidAccess: boolean;
  membershipLabel: string;
};

type Feature = {
  title: string;
  description: string;
  href: string;
  label: string;
  icon: LucideIcon;
  paid?: boolean;
};

const FEATURES: Feature[] = [
  { title: "Séance guidée", description: "Ta séance du jour, les consignes et tes démonstrations COAI.", href: "/programme/entrainement", label: "Gratuit", icon: ClipboardCheck },
  { title: "Journal des charges", description: "Note tes séries, répétitions et charges pour voir ton évolution.", href: "/suivi/seances", label: "Gratuit", icon: BookOpen },
  { title: "Programmes & vidéos", description: "Découvre les programmes et les vidéos réellement disponibles.", href: "/boutique", label: "Aperçu gratuit", icon: ClipboardCheck },
  { title: "Progrès & records", description: "Tes tendances, records personnels et statistiques détaillées.", href: "/suivi/progression", label: "Premium", icon: BarChart3, paid: true },
  { title: "Nutrition par photo", description: "Analyse ton plat ou un menu pour adapter tes repères alimentaires.", href: "/programme/alimentation", label: "Premium", icon: Camera, paid: true },
];

export function DashboardFeaturesCard({ hasPaidAccess, membershipLabel }: DashboardFeaturesCardProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.10] bg-[radial-gradient(circle_at_90%_0%,rgba(0,240,255,.12),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.065),rgba(255,255,255,.018))] p-5 sm:p-7" aria-labelledby="dashboard-features-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Fonctionnalités COAI</p>
          <h2 id="dashboard-features-title" className="mt-2 font-editorial text-3xl text-white sm:text-4xl">Ton entraînement. Ton suivi. Ton plan.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-300">Les cinq outils utiles réunis au même endroit. Les fonctionnalités payantes sont identifiées avant le clic.</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-laiton-400/35 bg-laiton-400/[0.10] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-laiton-100">{membershipLabel}</span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {FEATURES.map((feature) => {
          const paidLocked = Boolean(feature.paid && !hasPaidAccess);
          const Icon = feature.icon;
          return (
            <Link key={feature.title} href={paidLocked ? "/pricing" : feature.href} className="group flex min-h-48 flex-col rounded-2xl border border-white/[0.09] bg-graphite-950/45 p-4 transition hover:-translate-y-0.5 hover:border-cyan-300/35 hover:bg-white/[0.06]">
              <div className="flex items-start justify-between gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-200"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <span className={paidLocked ? "inline-flex items-center gap-1 rounded-full border border-laiton-400/35 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-laiton-100" : "rounded-full border border-emerald-300/30 bg-emerald-300/[0.08] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-emerald-200"}>
                  {paidLocked && <LockKeyhole className="h-3 w-3" aria-hidden="true" />}{feature.label}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold text-white">{feature.title}</h3>
              <p className="mt-2 text-xs leading-5 text-graphite-300">{feature.description}</p>
              <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-bold text-cyan-200">{paidLocked ? "Débloquer" : "Ouvrir"}<ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" /></span>
            </Link>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-graphite-300">
        <Link href="/fonctionnalites" className="inline-flex items-center gap-1 font-bold text-white hover:text-cyan-200">Ouvrir le menu complet <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
        <span>COAI Elite : accompagnement et ajustements VIP.</span>
      </div>
    </section>
  );
}
