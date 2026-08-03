"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/compte/profil", label: "Mon profil" },
  { href: "/programme", label: "Programme" },
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
      <span className="font-mono text-sm uppercase tracking-widest text-laiton-400">Lab Coach</span>
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
