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

// Sidebar verticale sur desktop (inspirée de dashboards type Resend : nav
// fixe à gauche, item actif en pastille pleine), repliée en barre horizontale
// compacte sur mobile pour rester utilisable sans menu burger.
export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 flex-col gap-3 border-b border-graphite-800 px-4 py-3 md:h-screen md:w-56 md:gap-6 md:border-b-0 md:border-r md:px-4 md:py-6">
      <span className="flex items-baseline gap-2 whitespace-nowrap font-mono uppercase text-laiton-400 md:flex-col md:items-start md:gap-0.5 md:px-2">
        <span className="text-sm tracking-widest">YUMAI</span>
        <span className="hidden text-[10px] tracking-[0.15em] text-graphite-400 md:inline">
          by Anthony Darmon · HI × AI™
        </span>
      </span>
      <div className="flex flex-row gap-x-5 gap-y-1 overflow-x-auto text-sm md:flex-col md:gap-1 md:overflow-visible">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "whitespace-nowrap text-laiton-400 md:rounded-lg md:bg-laiton-400/10 md:px-3 md:py-2 md:text-graphite-50"
                  : "whitespace-nowrap text-graphite-300 transition hover:text-graphite-50 md:rounded-lg md:px-3 md:py-2 md:hover:bg-white/[0.04]"
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
