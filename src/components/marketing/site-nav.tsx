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

// Nav publique (11/08/2026, simplifiée sur mobile le 14/08/2026) — la liste
// de liens (ancres de la homepage) reste sur desktop, où elle a de la
// place ; sur mobile, un menu déroulant entier pour y accéder ajoutait de
// la friction pour peu de valeur — remplacé par les deux seules actions qui
// comptent vraiment à ce stade (se connecter ou commencer), affichées
// directement dans le header, sans bouton hamburger ni panneau à ouvrir.
export function SiteNav({ connecte, hrefCompte }: { connecte: boolean; hrefCompte: string }) {
  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
      <Link href={hrefCompte} className="flex items-center gap-2.5">
        <CoaiMark size={22} />
        <span className="font-display text-base font-semibold tracking-[0.2em] text-white">COAI</span>
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

      <div className="flex items-center gap-2 lg:hidden">
        <Link
          href={connecte ? "/dashboard" : "/sign-in"}
          className="font-mono text-[0.6rem] uppercase tracking-widest text-graphite-300"
        >
          {connecte ? "Mon compte" : "Se connecter"}
        </Link>
        <Link
          href={connecte ? "/dashboard" : "/sign-up"}
          className="rounded-full bg-laiton-400 px-4 py-2 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-graphite-950"
        >
          Commencer
        </Link>
      </div>
    </div>
  );
}
