"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CoaiMark } from "@/components/brand/coai-mark";
import { SignOutButton } from "@/components/compte/sign-out-button";

const LINKS = [
  { href: "/dashboard", label: "Aujourd’hui", icon: "◉" },
  { href: "/programme/entrainement", label: "Mon programme", icon: "◇" },
  { href: "/suivi/progression", label: "Mon suivi", icon: "↗" },
  { href: "/coach", label: "Mon coach", icon: "✦" },
];

function isActive(pathname: string | null, href: string) {
  if (href === "/programme/entrainement") return pathname?.startsWith("/programme") ?? false;
  if (href === "/suivi/progression") return pathname?.startsWith("/suivi") ?? false;
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <aside className="coai-app-nav z-20 shrink-0 border-b px-5 py-4 backdrop-blur-xl md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-b-0 md:border-r md:px-6 md:py-8">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <CoaiMark size={26} />
            <span className="font-display text-xl font-extrabold tracking-[0.16em] text-white">COAI</span>
          </div>
          <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-graphite-300">Performance · Santé · Longévité</span>
        </Link>
        <SignOutButton variant="icon" />
      </div>

      <p className="mt-10 hidden text-[0.6rem] font-bold uppercase tracking-[0.18em] text-graphite-500 md:block">Ton parcours</p>
      <nav aria-label="Navigation principale" className="mt-4 flex gap-2 overflow-x-auto pb-1 text-sm md:mt-3 md:flex-1 md:flex-col md:overflow-visible">
        {LINKS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 whitespace-nowrap rounded-xl border px-3.5 py-3 font-semibold transition ${active ? "border-laiton-400/25 bg-laiton-400/[0.11] text-laiton-300" : "border-transparent text-graphite-300 hover:bg-white/[0.055] hover:text-white"}`}>
              <span className="w-4 text-center text-xs opacity-80" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 hidden border-t border-white/[0.09] pt-5 md:block">
        <Link href="/pricing" className="coai-rainbow-cta flex items-center justify-center rounded-xl px-4 py-3 text-sm font-extrabold text-[#111216]">Choisir mon accompagnement</Link>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-graphite-400">
          <Link href="/compte/profil" className="hover:text-white">Mon profil</Link>
          <Link href="/compte/parametres" className="hover:text-white">Réglages</Link>
        </div>
      </div>
    </aside>
  );
}
