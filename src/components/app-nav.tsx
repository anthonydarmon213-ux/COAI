"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CoaiMark } from "@/components/brand/coai-mark";
import { SignOutButton } from "@/components/compte/sign-out-button";

const NAVIGATION = [
  { href: "/dashboard", label: "Aujourd’hui", icon: "◉" },
  {
    label: "Mon programme",
    icon: "◇",
    match: "/programme",
    children: [
      { href: "/programme/entrainement", label: "Entraînement" },
      { href: "/programme/alimentation", label: "Nutrition" },
      { href: "/programme/recettes", label: "Recettes" },
      { href: "/programme/recuperation", label: "Récupération" },
      { href: "/programme/evolution", label: "Évolution du programme" },
      { href: "/programme/exercices", label: "Catalogue d’exercices" },
      { href: "/programme/programmes-prets", label: "Programmes prêts à l’emploi" },
    ],
  },
  {
    label: "Mon suivi",
    icon: "↗",
    match: "/suivi",
    children: [
      { href: "/suivi/progression", label: "Vue d’ensemble" },
      { href: "/suivi/mesures", label: "Mes mesures" },
      { href: "/suivi/seances", label: "Mes séances" },
      { href: "/suivi/alimentation", label: "Mon alimentation" },
      { href: "/suivi/tests-maxi", label: "Mes performances" },
    ],
  },
  {
    label: "Mes coachs",
    icon: "✦",
    match: "/coach",
    children: [
      { href: "/coach", label: "Poser une question" },
      { href: "/pricing", label: "Comparer les formules" },
      { href: "/compte/abonnement", label: "Mon abonnement" },
    ],
  },
];

function isActive(pathname: string | null, href: string) {
  if (href === "/programme/entrainement") return pathname?.startsWith("/programme") ?? false;
  if (href === "/suivi/progression") return pathname?.startsWith("/suivi") ?? false;
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <aside className="coai-app-nav z-20 shrink-0 border-b px-5 py-4 backdrop-blur-xl md:sticky md:top-0 md:flex md:h-screen md:w-56 md:flex-col md:border-b-0 md:border-r md:px-5 md:py-7">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <CoaiMark size={26} />
            <span className="font-display text-xl font-extrabold tracking-[0.16em] text-graphite-50">COAI</span>
          </div>
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-graphite-300">Ton Personal Trainer, toujours avec toi</span>
        </Link>
        <SignOutButton variant="icon" />
      </div>

      <p className="mt-10 hidden text-[0.6rem] font-bold uppercase tracking-[0.18em] text-graphite-500 md:block">Ton parcours</p>
      <nav aria-label="Navigation principale" className="coai-app-nav-scroll mt-4 flex gap-2 overflow-x-auto pb-1 text-sm md:mt-3 md:min-h-0 md:flex-1 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:pr-1">
        {NAVIGATION.map((item) => {
          if ("href" in item && item.href) {
            const active = isActive(pathname, item.href);
            return <Link key={item.href} href={item.href} className={`flex items-center gap-3 whitespace-nowrap rounded-xl border px-3.5 py-3 font-semibold transition ${active ? "border-laiton-400/30 bg-white/[0.08] text-white shadow-sm" : "border-transparent text-graphite-300 hover:bg-white/[0.06] hover:text-white"}`}><span className="w-4 text-center text-xs" aria-hidden="true">{item.icon}</span>{item.label}</Link>;
          }

          const groupActive = Boolean(pathname?.startsWith(item.match ?? "")) || item.children?.some((child) => isActive(pathname, child.href));
          return (
            <details key={item.label} className="coai-nav-group" open={groupActive}>
              <summary className={`flex cursor-pointer list-none items-center gap-3 rounded-xl border px-3.5 py-3 font-semibold transition ${groupActive ? "border-laiton-400/30 bg-white/[0.08] text-white shadow-sm" : "border-transparent text-graphite-300 hover:bg-white/[0.06] hover:text-white"}`}>
                <span className="w-4 text-center text-xs" aria-hidden="true">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                <span className="coai-nav-chevron text-[10px]" aria-hidden="true">⌄</span>
              </summary>
              <div className="ml-5 mt-1 flex flex-col border-l border-laiton-500/25 pl-3">
                {item.children?.map((child) => {
                  const active = isActive(pathname, child.href);
                  return <Link key={child.href} href={child.href} className={`rounded-lg px-3 py-2 text-[0.78rem] font-bold transition ${active ? "bg-white/[0.08] text-white" : "text-graphite-300 hover:bg-white/[0.06] hover:text-white"}`}>{child.label}</Link>;
                })}
              </div>
            </details>
          );
        })}
      </nav>

      <div className="mt-6 hidden border-t border-laiton-500/15 pt-5 md:block">
        <div className="grid grid-cols-2 gap-2 text-xs text-graphite-400">
          <Link href="/compte/profil" className="hover:text-white">Mon profil</Link>
          <Link href="/compte/parametres" className="hover:text-white">Réglages</Link>
        </div>
      </div>
    </aside>
  );
}
