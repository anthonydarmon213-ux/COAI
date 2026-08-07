"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CoaiMark } from "@/components/brand/coai-mark";
import { SignOutButton } from "@/components/compte/sign-out-button";

const LINKS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/programme", label: "Mon profil & programme" },
  { href: "/coach", label: "Votre coach IA" },
  { href: "/videos", label: "Vidéos" },
  { href: "/suivi/seances", label: "Séances" },
  { href: "/suivi/mesures", label: "Mesures" },
  { href: "/suivi/progression", label: "Progression" },
  { href: "/compte/abonnement", label: "Accompagnement" },
  { href: "/compte/parametres", label: "Paramètres" },
];

export function AppNav() {
  const pathname = usePathname();

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
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "whitespace-nowrap rounded-xl border border-laiton-400/20 bg-laiton-400/[0.08] px-3 py-2.5 text-laiton-300"
                  : "whitespace-nowrap rounded-xl border border-transparent px-3 py-2.5 text-graphite-400 transition hover:bg-white/[0.04] hover:text-white"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 hidden border-t border-white/[0.07] pt-6 md:block"><p className="font-editorial text-lg italic text-graphite-200">AI generates.<br />Humans validate.</p><p className="mt-3 text-xs leading-5 text-graphite-500">Une méthode conçue et supervisée par Anthony Darmon.</p></div>
    </aside>
  );
}
