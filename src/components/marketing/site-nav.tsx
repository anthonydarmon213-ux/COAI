"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CoaiMark } from "@/components/brand/coai-mark";

const LIENS = [
  { href: "/", label: "Accueil" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  // Accès direct aux tarifs (11/08/2026, correction Anthony) : le diagnostic
  // reste le parcours principal recommandé, mais ne doit jamais être un mur
  // obligatoire avant de consulter les offres — cf. /pricing, déjà public.
  { href: "/pricing", label: "Nos formules" },
  { href: "/vip", label: "Full Présentiel VIP" },
  { href: "/entreprise", label: "COAI Entreprise" },
  { href: "/a-propos", label: "À propos" },
];

// Nav publique (11/08/2026, simplifiée sur mobile le 14/08/2026) — la liste
// de liens (ancres de la homepage) reste sur desktop, où elle a de la
// place ; sur mobile, un menu déroulant entier pour y accéder ajoutait de
// la friction pour peu de valeur — remplacé par une seule action, affichée
// directement dans le header, sans bouton hamburger ni panneau à ouvrir.
//
// Le bilan reste l'action principale. La connexion est toutefois toujours
// accessible séparément pour les membres déjà inscrits.
export function SiteNav({ connecte }: { connecte: boolean }) {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const menuMobileRef = useRef<HTMLDivElement>(null);
  const actionHref = connecte ? "/dashboard" : "/diagnostic";
  const actionLabel = connecte ? "Mon compte" : "Bilan gratuit";

  useEffect(() => {
    if (!menuOuvert) return;

    const fermerHorsMenu = (event: PointerEvent) => {
      if (!menuMobileRef.current?.contains(event.target as Node)) {
        setMenuOuvert(false);
      }
    };
    const fermerAvecEchap = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOuvert(false);
    };

    document.addEventListener("pointerdown", fermerHorsMenu);
    document.addEventListener("keydown", fermerAvecEchap);

    return () => {
      document.removeEventListener("pointerdown", fermerHorsMenu);
      document.removeEventListener("keydown", fermerAvecEchap);
    };
  }, [menuOuvert]);

  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-10">
      <Link href="/" aria-label="COAI — retour à l’accueil" className="flex flex-col gap-0.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-laiton-300">
        <span className="flex items-center gap-2.5">
          <CoaiMark size={22} />
          <span className="font-display text-xl font-semibold tracking-[0.16em] text-white">COAI</span>
        </span>
        {/* Baseline officielle, reprise du storyboard publicitaire ou elle
            figure sous le logo. Elle remplace "Personal Training,
            Reimagined." : en anglais et interchangeable, cette formule ne
            disait pas ce que fait COAI. "Santé et longévité" ajouté le
            04/09/2026 (demande Anthony, inspiration enseigne "bangji —
            Longevity Skincare") : reprend la structure marque + ligne de
            catégorie courte de cette enseigne, sans retirer la baseline
            existante. Formulation précisée le même jour ("Santé et
            longévité" plutôt que "Coaching longévité", retour direct
            d'Anthony) ; "Coaching" gardé implicite ici car déjà porté par
            le logo COAI juste au-dessus. */}
        <span className="text-[0.55rem] font-medium uppercase tracking-[0.14em] text-laiton-200/80">
          Santé et longévité · L&apos;IA génère, ton coach valide.
        </span>
      </Link>

      <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigation principale">
        {LIENS.map((lien) => (
          <Link
            key={lien.label}
            href={lien.href}
            className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-graphite-300 transition hover:text-laiton-200"
          >
            {lien.label}
          </Link>
        ))}
      </nav>

      <div className="hidden items-center gap-3 lg:flex">
        {!connecte && (
          <Link
            href="/sign-in"
            className="rounded-full border border-white/15 px-5 py-2.5 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-white transition hover:border-laiton-300/45 hover:bg-white/[0.05]"
          >
            Se connecter
          </Link>
        )}
        <Link
          href={actionHref}
          className="rounded-full bg-laiton-400 px-5 py-2.5 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-graphite-950 transition hover:bg-laiton-300"
        >
          {actionLabel}
        </Link>
      </div>

      <div ref={menuMobileRef} className="relative lg:hidden">
        <button
          type="button"
          aria-expanded={menuOuvert}
          aria-controls="navigation-mobile"
          onClick={() => setMenuOuvert((ouvert) => !ouvert)}
          className="group flex items-center gap-3 rounded-full border border-laiton-300/25 bg-white/[0.035] px-4 py-2.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.06)] backdrop-blur-md transition hover:border-laiton-300/45 hover:bg-white/[0.06]"
        >
          Explorer
          <span className="relative block h-3.5 w-5" aria-hidden="true">
            <span className={`absolute left-0 top-[3px] h-px bg-laiton-200 transition-all duration-300 ${menuOuvert ? "w-5 translate-y-[3.5px] rotate-45" : "w-5"}`} />
            <span className={`absolute bottom-[3px] right-0 h-px bg-laiton-200 transition-all duration-300 ${menuOuvert ? "w-5 -translate-y-[3.5px] -rotate-45" : "w-3.5 group-hover:w-5"}`} />
          </span>
        </button>
        {menuOuvert && <nav id="navigation-mobile" className="coai-public-menu absolute right-0 top-12 flex w-64 flex-col overflow-hidden rounded-2xl border p-2 shadow-2xl" aria-label="Navigation mobile">
          {LIENS.map((lien) => (
            <Link onClick={() => setMenuOuvert(false)} key={lien.label} href={lien.href} className="coai-public-menu-link rounded-xl px-4 py-3 text-sm font-semibold transition">{lien.label}</Link>
          ))}
          {!connecte && (
            <Link onClick={() => setMenuOuvert(false)} href="/sign-in" className="coai-public-menu-link rounded-xl px-4 py-3 text-sm font-semibold transition">
              Se connecter
            </Link>
          )}
          <Link onClick={() => setMenuOuvert(false)} href={actionHref} className="coai-public-menu-action mt-2 rounded-xl px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.08em]">{actionLabel}</Link>
        </nav>}
      </div>
    </div>
  );
}
