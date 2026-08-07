"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  { href: "/programme#profil", label: "Votre profil" },
  { href: "/programme#programme", label: "Votre programme" },
  { href: "/coach", label: "Votre coach IA" },
  { href: "/videos", label: "Streaming" },
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
const CHILD_ACTIVE_CLASS = "rounded-lg bg-laiton-400/[0.1] px-3 py-2 text-sm text-laiton-300";
const CHILD_INACTIVE_CLASS =
  "rounded-lg px-3 py-2 text-sm text-graphite-300 transition hover:bg-white/[0.06] hover:text-white";

function isActive(pathname: string | null, href: string) {
  const path = href.split("#")[0];
  return pathname === path || (pathname?.startsWith(`${path}/`) ?? false);
}

// Menu déroulant flottant (portalé sur document.body, position fixed) : sur
// mobile la nav est en défilement horizontal (overflow-x-auto), ce qui coupe
// aussi le débordement vertical — un simple dropdown en position absolute
// serait rogné. Le portail contourne ce problème.
function NavGroupDropdown({ item, active }: { item: NavGroup; active: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function updateCoords() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    updateCoords();

    function handleClickOutside(e: MouseEvent) {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      setOpen(false);
    }

    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 ${active ? ACTIVE_CLASS : INACTIVE_CLASS}`}
      >
        {item.label}
        <span className={`text-[10px] transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: "fixed", top: coords.top, left: coords.left, minWidth: Math.max(coords.width, 176) }}
            className="z-50 flex flex-col gap-0.5 rounded-xl border border-white/10 bg-[#14161a] p-1.5 shadow-2xl shadow-black/60"
          >
            {item.children.map((child) => {
              const childActive = isActive(pathname, child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setOpen(false)}
                  className={childActive ? CHILD_ACTIVE_CLASS : CHILD_INACTIVE_CLASS}
                >
                  {child.label}
                </Link>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <aside className="z-20 shrink-0 border-b border-white/[0.07] bg-[#0b0c0e]/95 px-5 py-4 backdrop-blur-xl md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-b-0 md:border-r md:px-6 md:py-8">
      <div className="flex items-center justify-between md:block">
        <Link href="/dashboard" className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <CoaiMark size={26} />
            <span className="font-display text-xl font-semibold tracking-[0.18em] text-white">
              COAI
              <span className="ml-2 font-mono text-[0.55rem] font-normal tracking-[0.2em] text-laiton-400">
                HI × AI™
              </span>
            </span>
          </div>
          <span className="text-[0.65rem] font-medium tracking-wide text-graphite-300">
            AI generates. Humans validate.
          </span>
        </Link>
        <div className="flex items-center gap-2 md:mt-5">
          <span className="rounded-full border border-laiton-400/20 bg-laiton-400/[0.06] px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-wider text-laiton-300">Beta</span>
          <SignOutButton variant="icon" />
        </div>
      </div>
      <nav aria-label="Navigation principale" className="mt-4 flex gap-2 overflow-x-auto pb-1 text-sm md:mt-10 md:flex-1 md:flex-col md:overflow-visible">
        {LINKS.map((item) => {
          if (!isGroup(item)) {
            const active = isActive(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className={active ? ACTIVE_CLASS : INACTIVE_CLASS}>
                {item.label}
              </Link>
            );
          }

          const groupActive = item.children.some((child) => isActive(pathname, child.href));
          return <NavGroupDropdown key={item.label} item={item} active={groupActive} />;
        })}
      </nav>
      <div className="mt-8 hidden border-t border-white/[0.07] pt-6 md:block"><p className="text-xs leading-5 text-graphite-500">Une méthode conçue et supervisée par Anthony Darmon.</p></div>
    </aside>
  );
}
