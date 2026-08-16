import Link from "next/link";
import { CoaiMark } from "@/components/brand/coai-mark";

const LIENS = [
  { href: "/", label: "Accueil" },
  { href: "/#comment-ca-marche", label: "Comment ça marche" },
  // Accès direct aux tarifs (11/08/2026, correction Anthony) : le diagnostic
  // reste le parcours principal recommandé, mais ne doit jamais être un mur
  // obligatoire avant de consulter les offres — cf. /pricing, déjà public.
  { href: "/pricing", label: "Nos formules" },
  { href: "/vip", label: "COAI Privé" },
  { href: "/entreprise", label: "Entreprise" },
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
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-10">
      <Link href={hrefCompte} className="flex flex-col gap-0.5">
        <span className="flex items-center gap-2.5">
          <CoaiMark size={22} />
          <span className="font-display text-xl font-semibold tracking-[0.16em] text-white">COAI</span>
        </span>
        <span className="text-[0.55rem] font-medium uppercase tracking-[0.1em] text-graphite-400">
          Performance · santé · longévité
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

      <Link
        href={actionHref}
        className="hidden rounded-full bg-laiton-400 px-5 py-2.5 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-graphite-950 transition hover:bg-laiton-300 lg:inline-block"
      >
        {actionLabel}
      </Link>

      <details className="group relative lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/[0.12] px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-white marker:hidden">
          Menu <span className="text-laiton-300 transition group-open:rotate-45">＋</span>
        </summary>
        <nav className="coai-public-menu absolute right-0 top-12 flex w-64 flex-col overflow-hidden rounded-2xl border p-2 shadow-2xl" aria-label="Navigation mobile">
          {LIENS.map((lien) => (
            <Link key={lien.label} href={lien.href} className="coai-public-menu-link rounded-xl px-4 py-3 text-sm font-semibold transition">{lien.label}</Link>
          ))}
          <Link href={actionHref} className="coai-public-menu-action mt-2 rounded-xl px-4 py-3 text-center text-xs font-bold uppercase tracking-[0.08em]">{actionLabel}</Link>
        </nav>
      </details>
    </div>
  );
}
