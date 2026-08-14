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
  { href: "/a-propos", label: "À propos" },
];

// Nav publique (11/08/2026, simplifiée sur mobile le 14/08/2026) — la liste
// de liens (ancres de la homepage) reste sur desktop, où elle a de la
// place ; sur mobile, un menu déroulant entier pour y accéder ajoutait de
// la friction pour peu de valeur — remplacé par une seule action, affichée
// directement dans le header, sans bouton hamburger ni panneau à ouvrir.
//
// Un seul bouton d'action, pas deux (14/08/2026, correction Anthony) —
// "Se connecter" et "Commencer" pointaient tous les deux vers /dashboard
// une fois connecté (bug réel, pas juste une redondance visuelle) : gardé
// uniquement le bouton qui a du sens dans chaque état. Un visiteur non
// connecté qui clique "Commencer" et a déjà un compte retrouve "Se
// connecter" directement sur /sign-up (lien déjà présent là-bas).
export function SiteNav({ connecte, hrefCompte }: { connecte: boolean; hrefCompte: string }) {
  const actionHref = connecte ? "/dashboard" : "/sign-up";
  const actionLabel = connecte ? "Mon compte" : "Commencer";

  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-10">
      <Link href={hrefCompte} className="flex flex-col gap-0.5">
        <span className="flex items-center gap-2.5">
          <CoaiMark size={22} />
          <span className="font-display text-base font-semibold tracking-[0.2em] text-white">COAI</span>
        </span>
        <span className="text-[0.55rem] font-medium tracking-wide text-graphite-400">
          Coaching humain augmenté par l&apos;IA.
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

      <Link
        href={actionHref}
        className="hidden rounded-full bg-laiton-400 px-5 py-2.5 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-graphite-950 transition hover:bg-laiton-300 lg:inline-block"
      >
        {actionLabel}
      </Link>

      <Link
        href={actionHref}
        className="rounded-full bg-laiton-400 px-4 py-2 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-graphite-950 lg:hidden"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
