"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Dumbbell, TrendingUp, Apple, MessageSquare, type LucideIcon } from "lucide-react";
import { CoaiMark } from "@/components/brand/coai-mark";
import { SignOutButton } from "@/components/compte/sign-out-button";

// Refonte complète (21/08/2026, demande Anthony — "épuré, moderne, qualité
// app native premium") : remplace l'ancienne nav à 3 groupes déroulants
// (<details>/<summary>, ~15 liens visibles) par 5 onglets fixes, sans
// accordéon ni sous-menu. Chaque onglet pointe vers la page d'entrée réelle
// du pilier plutôt qu'un nouveau chemin inventé ("/workout", "/nutrition")
// qui n'existe pas dans l'app — /suivi/progression, /programme/entrainement
// et /programme/alimentation sont les routes réelles.
const ONGLETS: { href: string; label: string; icon: LucideIcon; match: string }[] = [
  { href: "/dashboard", label: "Aujourd’hui", icon: CalendarDays, match: "/dashboard" },
  { href: "/programme/entrainement", label: "Entraînement", icon: Dumbbell, match: "/programme" },
  { href: "/suivi/progression", label: "Progression", icon: TrendingUp, match: "/suivi" },
  { href: "/programme/alimentation", label: "Nutrition", icon: Apple, match: "/programme/alimentation" },
  { href: "/coach", label: "Mon Coach", icon: MessageSquare, match: "/coach" },
];

function isActive(pathname: string | null, onglet: (typeof ONGLETS)[number]) {
  if (!pathname) return false;
  // "Entraînement" reste actif sur tout /programme SAUF /programme/alimentation,
  // qui a son propre onglet "Nutrition" — sans cette exclusion les deux
  // onglets s'allumeraient ensemble sur les pages nutrition.
  if (onglet.href === "/programme/entrainement") {
    return pathname.startsWith("/programme") && !pathname.startsWith("/programme/alimentation");
  }
  return pathname === onglet.match || pathname.startsWith(`${onglet.match}/`);
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

      <nav aria-label="Navigation principale" className="coai-app-nav-scroll mt-6 flex gap-2 overflow-x-auto pb-1 text-sm md:mt-8 md:min-h-0 md:flex-1 md:flex-col md:gap-1.5 md:overflow-x-hidden md:overflow-y-auto md:pr-1">
        {ONGLETS.map((onglet) => {
          const active = isActive(pathname, onglet);
          const Icon = onglet.icon;
          return (
            <Link
              key={onglet.href}
              href={onglet.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-3 whitespace-nowrap rounded-xl px-3.5 py-3 font-semibold transition ${
                active ? "bg-white/[0.08] text-white shadow-sm" : "text-graphite-300 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {active && (
                <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-laiton-400 md:inset-y-2" />
              )}
              <Icon size={18} strokeWidth={2} className={active ? "text-laiton-300" : "text-graphite-500"} aria-hidden="true" />
              {onglet.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 hidden border-t border-laiton-500/15 pt-5 md:block">
        <div className="grid grid-cols-2 gap-2 text-xs text-graphite-400">
          <Link href="/compte/profil" className="hover:text-white">Profil</Link>
          <Link href="/compte/parametres" className="hover:text-white">Réglages</Link>
        </div>
      </div>
    </aside>
  );
}
