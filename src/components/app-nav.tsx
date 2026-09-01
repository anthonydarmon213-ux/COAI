"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Dumbbell, TrendingUp, Apple, MessageSquare, Moon, Play, LayoutGrid, ClipboardList, type LucideIcon } from "lucide-react";
import { CoaiMark } from "@/components/brand/coai-mark";
import { SignOutButton } from "@/components/compte/sign-out-button";

// Refonte complète (21/08/2026, demande Anthony — "épuré, moderne, qualité
// app native premium") : remplace l'ancienne nav à 3 groupes déroulants
// (<details>/<summary>, ~15 liens visibles) par 5 onglets fixes, sans
// accordéon ni sous-menu. Chaque onglet pointe vers la page d'entrée réelle
// du pilier plutôt qu'un nouveau chemin inventé ("/workout", "/nutrition")
// qui n'existe pas dans l'app — /suivi/progression, /programme/entrainement
// et /programme/alimentation sont les routes réelles.
// Sous-menus (23/08/2026, demande Anthony) — la simplification en 5 onglets
// du 22/08 avait rendu inaccessibles des pages qui existaient toujours :
// catalogue de recettes, bibliothèque d'exercices, historique des séances,
// mesures, tests maxi, évolution. Aucune page nouvelle ici, uniquement le
// chemin pour y accéder à nouveau.
//
// Les sous-menus ne s'affichent que sous l'onglet actif : les déplier tous
// en permanence donnerait 17 liens dans une colonne de 224px, soit
// exactement la surcharge que la simplification voulait supprimer.
type SousLien = { href: string; label: string };

// Code couleur par pilier (01/09/2026, demande Anthony) : chaque univers a
// sa teinte, l'utilisateur se repère à la couleur avant même de lire. Les
// valeurs sont des RGB bruts pour être injectées en variable CSS et servir à
// la fois au halo, à la bordure et au liseré actif.
const ONGLETS: {
  href: string;
  label: string;
  icon: LucideIcon;
  match: string;
  teinte: string;
  sous?: SousLien[];
}[] = [
  { href: "/dashboard", label: "Aujourd’hui", icon: CalendarDays, match: "/dashboard", teinte: "201,162,98" },
  // Le carnet de séances (RepCount) est promu en entrée principale
  // (01/09/2026, demande Anthony : « en priorité et en avant »). Il était
  // enterré comme 1er sous-lien de Progression, invisible tant que l'onglet
  // n'était pas ouvert — alors que c'est le geste quotidien de l'app.
  { href: "/suivi/seances", label: "Mes séances", icon: ClipboardList, match: "/suivi/seances", teinte: "244,63,94" },
  {
    href: "/programme/entrainement",
    label: "Entraînement",
    icon: Dumbbell,
    match: "/programme",
    teinte: "76,201,240",
    sous: [
      { href: "/programme/entrainement", label: "Séance du jour" },
      // "Ma fiche séance" plutôt que "Fiche imprimable" (23/08/2026,
      // Anthony : "personne ne va imprimer") — l'usage réel est de la
      // consulter et de la partager ; le PDF n'est qu'une des sorties.
      { href: "/programme/seance-du-jour", label: "Ma fiche séance" },
      { href: "/programme/exercices", label: "Bibliothèque d’exercices" },
      { href: "/programme/programmes-prets", label: "Programmes prêts" },
    ],
  },
  {
    href: "/programme/alimentation",
    label: "Nutrition",
    icon: Apple,
    match: "/programme/alimentation",
    teinte: "52,211,153",
    sous: [
      { href: "/programme/alimentation", label: "Plan du jour" },
      { href: "/programme/recettes", label: "Catalogue de recettes" },
      { href: "/suivi/alimentation", label: "Suivi des macros" },
    ],
  },
  // Récupération en onglet principal (23/08/2026, demande Anthony : "c'est
  // un de nos piliers"). Elle était sous-menu d'Entraînement, ce qui la
  // reléguait au rang de détail alors que COAI repose sur trois piliers —
  // entraînement, nutrition, récupération. Placée juste après Nutrition
  // pour que les trois se suivent dans la navigation.
  {
    href: "/programme/recuperation",
    label: "Récupération",
    icon: Moon,
    match: "/programme/recuperation",
    teinte: "167,139,250",
    // Pas de sous-menu : la page de récupération est unique. Le lien
    // « Sommeil & mesures » pointait en réalité vers /suivi/mesures, qui ne
    // contient que des mesures corporelles (poids, tour de taille) et aucun
    // contenu sommeil — libellé trompeur, et doublon de « Mesures » sous
    // Progression.
  },
  {
    href: "/suivi/progression",
    label: "Progression",
    icon: TrendingUp,
    match: "/suivi",
    teinte: "251,146,60",
    sous: [
      { href: "/suivi/progression", label: "Poids soulevé" },
      { href: "/suivi/tests-maxi", label: "Mes records" },
      { href: "/suivi/mesures", label: "Poids & mensurations" },
      { href: "/programme/evolution", label: "Activité quotidienne" },
    ],
  },
  { href: "/videos", label: "Vidéos exclusives", icon: Play, match: "/videos", teinte: "244,114,182" },
  { href: "/coach", label: "Mon Coach", icon: MessageSquare, match: "/coach", teinte: "56,189,248" },
  // Une entrée unique vers la page qui présente toutes les fonctions COAI
  // et ce qui est inclus ou payant. Volontairement SANS sous-menu : les
  // dix sous-liens envisagés pointaient tous vers des pages déjà
  // présentes ailleurs dans cette colonne — neuf doublons sur neuf, pour
  // un menu passant à 30 liens dans 224 px. La pédagogie se fait sur la
  // page, pas dans la barre.
  { href: "/fonctionnalites", label: "Fonctionnalités", icon: LayoutGrid, match: "/fonctionnalites", teinte: "148,163,184" },
];

function isActive(pathname: string | null, onglet: (typeof ONGLETS)[number]) {
  if (!pathname) return false;
  // "Entraînement" reste actif sur tout /programme SAUF /programme/alimentation,
  // qui a son propre onglet "Nutrition" — sans cette exclusion les deux
  // onglets s'allumeraient ensemble sur les pages nutrition.
  // Entraînement couvre /programme SAUF les sections qui ont leur propre
  // onglet — sans ces exclusions, deux onglets s'allumeraient ensemble.
  // Progression couvre tout /suivi SAUF le carnet de séances, qui a
  // désormais son propre onglet : sans cette exclusion, ouvrir « Mes
  // séances » allumerait Progression, exactement le défaut qu'on venait de
  // corriger dans l'autre sens.
  if (onglet.href === "/suivi/progression") {
    return pathname.startsWith("/suivi") && !pathname.startsWith("/suivi/seances");
  }
  if (onglet.href === "/programme/entrainement") {
    return (
      pathname.startsWith("/programme") &&
      !pathname.startsWith("/programme/alimentation") &&
      !pathname.startsWith("/programme/recuperation")
    );
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
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-graphite-300">Ton coach personnel, toujours avec toi</span>
        </Link>
        <SignOutButton variant="icon" />
      </div>

      <nav aria-label="Navigation principale" className="coai-app-nav-scroll mt-6 flex gap-2 overflow-x-auto pb-1 text-sm md:mt-8 md:min-h-0 md:flex-1 md:flex-col md:gap-1.5 md:overflow-x-hidden md:overflow-y-auto md:pr-1">
        {ONGLETS.map((onglet) => {
          const active = isActive(pathname, onglet);
          const Icon = onglet.icon;
          return (
            <div key={onglet.href} className="contents md:block">
            <Link
              href={onglet.href}
              aria-current={active ? "page" : undefined}
              style={{ ["--teinte" as string]: onglet.teinte }}
              className={`coai-nav-lien group/nav relative flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 font-semibold transition duration-300 ${
                active ? "coai-nav-actif text-white" : "border border-transparent text-graphite-200 hover:text-white"
              }`}
            >
              {active && (
                <span aria-hidden="true" className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[rgb(var(--teinte))] md:inset-y-2" />
              )}
              <span className="coai-nav-icone flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition duration-300">
                <Icon size={19} strokeWidth={active ? 2.35 : 2.1} aria-hidden="true" />
              </span>
              {onglet.label}
            </Link>

            {/* Sous-liens visibles uniquement sous l'onglet actif, et
                seulement sur desktop : la barre mobile défile
                horizontalement, y empiler des sous-niveaux la rendrait
                illisible. */}
            {active && onglet.sous && (
              <div className="ml-3 mt-1 hidden flex-col gap-0.5 border-l border-white/10 pl-3 md:flex">
                {onglet.sous.map((sl) => {
                  const sousActif = pathname === sl.href;
                  return (
                    <Link
                      key={sl.href}
                      href={sl.href}
                      aria-current={sousActif ? "page" : undefined}
                      className={`rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition ${
                        sousActif ? "bg-laiton-400/10 text-laiton-200" : "text-graphite-400 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      {sl.label}
                    </Link>
                  );
                })}
              </div>
            )}
            </div>
          );
        })}
      </nav>

      <div className="mt-6 hidden border-t border-laiton-500/15 pt-5 md:block">
        <div className="grid grid-cols-2 gap-2 text-xs text-graphite-400">
          <Link href="/compte/profil" className="hover:text-white">Profil</Link>
          <Link href="/compte/parametres" className="hover:text-white">Réglages</Link>
          <Link href="/compte/abonnement" className="hover:text-white">Abonnement</Link>
          <Link href="/avis" className="hover:text-white">Mon avis</Link>
        </div>
      </div>
    </aside>
  );
}
