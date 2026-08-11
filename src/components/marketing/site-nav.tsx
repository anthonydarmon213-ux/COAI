"use client";

import { useState } from "react";
import Link from "next/link";
import { CoaiMark } from "@/components/brand/coai-mark";

const LIENS = [
  { href: "/", label: "Accueil" },
  { href: "/#piliers", label: "Fonctionnalités" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  // Accès direct aux tarifs (11/08/2026, correction Anthony) : le diagnostic
  // reste le parcours principal recommandé, mais ne doit jamais être un mur
  // obligatoire avant de consulter les offres — cf. /pricing, déjà public.
  { href: "/pricing", label: "Nos formules" },
  { href: "/#fondateur", label: "Coaching" },
  { href: "/#histoire", label: "À propos" },
];

// Nav publique complète (11/08/2026) — remplace le header minimal
// (logo + "Se connecter") par une vraie navigation avec ancres vers les
// sections existantes de la homepage, cohérente sur toutes les pages
// marketing (pricing, diagnostic, pages SEO...) puisque ce composant vit
// dans le layout partagé. Les liens `/#section` fonctionnent depuis
// n'importe quelle page marketing (retour à l'accueil puis scroll).
export function SiteNav({ connecte, hrefCompte }: { connecte: boolean; hrefCompte: string }) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
      <Link href={hrefCompte} className="flex items-center gap-2.5">
        <CoaiMark size={22} />
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-semibold tracking-[0.2em] text-white">COAI</span>
          <span className="font-mono text-[0.5rem] font-normal tracking-[0.2em] text-laiton-400">HI × AI™</span>
        </span>
      </Link>

      <nav className="hidden items-center gap-7 lg:flex">
        {LIENS.map((lien) => (
          <Link
            key={lien.label}
            href={lien.href}
            className="font-mono text-[0.7rem] uppercase tracking-widest text-graphite-300 transition hover:text-white"
          >
            {lien.label}
          </Link>
        ))}
      </nav>

      <div className="hidden items-center gap-3 lg:flex">
        <Link
          href={connecte ? "/dashboard" : "/sign-in"}
          className="font-mono text-[0.65rem] uppercase tracking-widest text-graphite-400 transition hover:text-white"
        >
          {connecte ? "Mon compte" : "Se connecter"}
        </Link>
        <Link
          href={connecte ? "/dashboard" : "/sign-up"}
          className="rounded-full bg-laiton-400 px-5 py-2.5 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-graphite-950 transition hover:bg-laiton-300"
        >
          Commencer
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-label="Menu"
        aria-expanded={ouvert}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white lg:hidden"
      >
        {ouvert ? "×" : "☰"}
      </button>

      {ouvert && (
        <div className="absolute inset-x-0 top-full flex flex-col gap-1 border-t border-white/10 bg-[#0b0c0e] px-6 py-4 lg:hidden">
          {LIENS.map((lien) => (
            <Link
              key={lien.label}
              href={lien.href}
              onClick={() => setOuvert(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-graphite-200 transition hover:bg-white/[0.04] hover:text-white"
            >
              {lien.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-white/[0.08] pt-3">
            <Link
              href={connecte ? "/dashboard" : "/sign-in"}
              onClick={() => setOuvert(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-graphite-300 hover:bg-white/[0.04] hover:text-white"
            >
              {connecte ? "Mon compte" : "Se connecter"}
            </Link>
            <Link
              href={connecte ? "/dashboard" : "/sign-up"}
              onClick={() => setOuvert(false)}
              className="rounded-full bg-laiton-400 px-4 py-2.5 text-center text-sm font-semibold text-graphite-950"
            >
              Commencer
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
