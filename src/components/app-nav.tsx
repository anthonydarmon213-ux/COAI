"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CoaiMark } from "@/components/brand/coai-mark";
import { SignOutButton } from "@/components/compte/sign-out-button";

type NavLink = { href: string; label: string };
type NavGroup = { label: string; children: NavLink[] };
type NavItem = NavLink | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

// Suivi (/suivi/*) et Compte (/compte/*) regroupent des routes déjà liées
// par leur préfixe d'URL — évite un menu à 9 entrées à plat.
const LINKS: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/programme", label: "Votre profil et programme" },
  { href: "/coach", label: "Votre coach IA" },
  { href: "/videos", label: "Vidéos" },
  {
    label: "Suivi",
    children: [
      { href: "/suivi/seances", label: "Séances" },
      { href: "/suivi/mesures", label: "Mesures" },
      { href: "/suivi/progression", label: "Progression" },
    ],
  },
  {
    label: "Compte",
    children: [
      { href: "/compte/abonnement", label: "Accompagnement" },
      { href: "/compte/parametres", label: "Paramètres" },
    ],
  },
];

const ACTIVE_CLASS =
  "whitespace-nowrap rounded-xl border border-laiton-400/20 bg-laiton-400/[0.08] px-3 py-2.5 text-laiton-300";
const INACTIVE_CLASS =
  "whitespace-nowrap rounded-xl border border-transparent px-3 py-2.5 text-graphite-400 transition hover:bg-white/[0.04] hover:text-white";
const CHILD_ACTIVE_CLASS =
  "whitespace-nowrap rounded-xl border border-laiton-400/20 bg-laiton-400/[0.08] px-3 py-2 pl-6 text-sm text-laiton-300";
const CHILD_INACTIVE_CLASS =
  "whitespace-nowrap rounded-xl border border-transparent px-3 py-2 pl-6 text-sm text-graphite-400 transition hover:bg-white/[0.04] hover:text-white";

function isActive(pathname: string | null, href: string) {
  return pathname === href || (pathname?.startsWith(`${href}/`) ?? false);
}

export function AppNav() {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <aside className="z-20 shrink-0 border-b border-white/[0.07] bg-[#0b0c0e]/95 px-5 py-4 backdrop-blur-xl md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-b-0 md:border-r md:px-6 md:py-8">
      <div className="flex items-center justify-between md:block">
        <div className="flex items-center gap-2.5">
          <CoaiMark size={26} />
          <span className="font-display text-xl font-semibold tracking-[0.18em] text-white">
            COAI
            <span className="ml-2 font-mono text-[0.55rem] font-normal tracking-[0.2em] text-laiton-400">
              HI × AI™
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 md:mt-5">
          <span className="rounded-full border border-laiton-400/20 bg-laiton-400/[0.06] px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-wider text-laiton-300">Beta</span>
          <SignOutButton variant="icon" />
        </div>
      </div>
      <nav aria-label="Navigation principale" className="mt-4 flex gap-2 overflow-x-auto pb-1 text-sm md:mt-10 md:flex-1 md:flex-col md:overflow-visible">
        {LINKS.flatMap((item) => {
          if (!isGroup(item)) {
            const active = isActive(pathname, item.href);
            return [
              <Link key={item.href} href={item.href} className={active ? ACTIVE_CLASS : INACTIVE_CLASS}>
                {item.label}
              </Link>,
            ];
          }

          const groupActive = item.children.some((child) => isActive(pathname, child.href));
          const open = openGroup === item.label || groupActive;

          const toggle = (
            <button
              key={item.label}
              type="button"
              onClick={() => setOpenGroup((prev) => (prev === item.label ? null : item.label))}
              className={`flex items-center gap-1.5 ${groupActive ? ACTIVE_CLASS : INACTIVE_CLASS}`}
            >
              {item.label}
              <span className={`text-[10px] transition ${open ? "rotate-180" : ""}`}>▾</span>
            </button>
          );

          if (!open) return [toggle];

          return [
            toggle,
            ...item.children.map((child) => {
              const active = isActive(pathname, child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={active ? CHILD_ACTIVE_CLASS : CHILD_INACTIVE_CLASS}
                >
                  {child.label}
                </Link>
              );
            }),
          ];
        })}
      </nav>
      <div className="mt-8 hidden border-t border-white/[0.07] pt-6 md:block"><p className="font-editorial text-lg italic text-graphite-200">AI generates.<br />Humans validate.</p><p className="mt-3 text-xs leading-5 text-graphite-500">Une méthode conçue et supervisée par Anthony Darmon.</p></div>
    </aside>
  );
}
