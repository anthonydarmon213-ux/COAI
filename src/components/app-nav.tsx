"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/programme", label: "Mon profil & programme" },
  { href: "/suivi/seances", label: "Séances" },
  { href: "/suivi/mesures", label: "Mesures" },
  { href: "/suivi/progression", label: "Progression" },
  { href: "/compte/abonnement", label: "Abonnement" },
  { href: "/compte/parametres", label: "Paramètres" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-graphite-800 px-6 py-4">
      <span className="flex items-baseline gap-2 font-mono uppercase text-laiton-400">
        <span className="text-sm tracking-widest">YUMAI</span>
        <span className="text-[10px] tracking-[0.2em] text-graphite-400">HI × AI™</span>
      </span>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "text-laiton-400"
                  : "text-graphite-300 transition hover:text-graphite-50"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
