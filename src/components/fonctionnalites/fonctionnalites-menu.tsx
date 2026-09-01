import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ClipboardList,
  Dumbbell,
  LockKeyhole,
  Repeat2,
  Sparkles,
  Target,
  Watch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EffectivePlan } from "@/lib/subscription/plan";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";

type Fonction = {
  href: string;
  label: string;
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
};

const FONCTIONS: Fonction[] = [
  {
    href: "/programme/entrainement",
    label: "01 · Aujourd’hui",
    title: "Séance du jour",
    description: "Ouvre directement la séance prévue et adaptée à ton état du jour.",
    detail: "Bilan rapide · séance claire · alternatives",
    icon: Dumbbell,
  },
  {
    href: "/suivi/seances",
    label: "02 · Suivi",
    title: "Journal des charges",
    description: "Note tes séries, répétitions, charges et sensations sans quitter ton parcours.",
    detail: "Charges · énergie · douleur · notes",
    icon: ClipboardList,
  },
  {
    href: "/boutique",
    label: "03 · Plan",
    title: "Routines & programmes",
    description: "Retrouve tes programmes, tes cycles et les séances à venir au même endroit.",
    detail: "Calendrier · cycles · séance B",
    icon: Repeat2,
  },
  {
    href: "/suivi/progression",
    label: "04 · Résultats",
    title: "Progression",
    description: "Observe tes tendances et transforme chaque entraînement en repère utile.",
    detail: "Force · régularité · mesures",
    icon: BarChart3,
  },
  {
    href: "/programme/exercices",
    label: "05 · Référence",
    title: "Exercices & vidéos",
    description: "Retrouve les démonstrations COAI et les variantes correspondant à ton matériel.",
    detail: "Visuels COAI · vidéos · alternatives",
    icon: BookOpen,
  },
];

const PREMIUM_FEATURES = [
  "Adaptation IA continue selon tes progrès et tes contraintes",
  "Statistiques avancées : volume, séries, répétitions, durée et poids du corps",
  "Supersets antagonistes, dropsets et historique détaillé",
  "Synchronisation bracelet connecté et signaux de récupération",
  "Export de tes données et accompagnement coaching / VIP",
];

export function FonctionnalitesMenu({
  plan,
  hasPaidAccess,
  membershipLabel,
}: {
  plan: EffectivePlan;
  hasPaidAccess: boolean;
  membershipLabel: string;
}) {
  // Le plan technique GRATUIT correspond historiquement au Pass IA payant.
  // Le verrou UI doit donc suivre le statut d'abonnement, pas le nom legacy.
  void plan;
  const hasPaidPlan = hasPaidAccess;

  return (
    <div className="flex flex-col gap-9">
      <div className="animate-reveal flex flex-col gap-4 border-b border-acier/25 pb-8">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>COAI · Fonctionnalités</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Tout ce qui te fait progresser.</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-graphite-300">
              Cinq accès essentiels, une seule logique : choisir, enregistrer, comprendre, avancer.
            </p>
          </div>
          <Badge tone={hasPaidPlan ? "success" : "neutral"}>{membershipLabel}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-graphite-300">COAI Free · essentiels</span>
          <span className="rounded-full border border-laiton-400/25 bg-laiton-400/[0.08] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-laiton-200">COAI Premium · IA & suivi</span>
          <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-cyan-200">COAI Elite · VIP</span>
        </div>
      </div>

      <section aria-labelledby="fonctions-essentielles" className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div id="fonctions-essentielles">
              <SectionLabel>Les 5 essentiels</SectionLabel>
            </div>
            <p className="mt-2 text-sm text-graphite-400">Les outils que tu utiliseras le plus, sans menus compliqués.</p>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-graphite-500 sm:inline">100% accessibles</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {FONCTIONS.map((fonction) => {
            const Icon = fonction.icon;
            return (
              <Link
                key={fonction.href}
                href={fonction.href}
                className="group flex min-h-[238px] flex-col rounded-2xl border border-white/[0.09] bg-[linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.02))] p-5 shadow-[0_22px_70px_-42px_rgba(0,0,0,.95)] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-[linear-gradient(145deg,rgba(76,201,240,.12),rgba(255,255,255,.035))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-laiton-400/25 bg-laiton-400/10 text-laiton-200 transition group-hover:border-cyan-300/35 group-hover:bg-cyan-300/10 group-hover:text-cyan-200">
                    <Icon size={21} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className="rounded-full border border-laiton-400/20 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-laiton-300">Gratuit</span>
                </div>
                <span className="mt-6 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-graphite-500">{fonction.label}</span>
                <h2 className="mt-2 text-lg font-semibold text-white">{fonction.title}</h2>
                <p className="mt-2 text-sm leading-5 text-graphite-300">{fonction.description}</p>
                <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                  <span className="text-[11px] font-medium leading-4 text-graphite-500">{fonction.detail}</span>
                  <ArrowRight size={17} className="shrink-0 text-laiton-300 transition group-hover:translate-x-1 group-hover:text-cyan-200" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="parcours-coai" className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="relative overflow-hidden border-cyan-300/15 bg-[radial-gradient(circle_at_0%_0%,rgba(76,201,240,.16),transparent_44%),rgba(255,255,255,.035)] p-6 sm:p-7">
          <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full border border-cyan-300/15" aria-hidden="true" />
          <div className="relative flex flex-col gap-5">
            <div>
              <div id="parcours-coai">
                <SectionLabel>Le parcours COAI</SectionLabel>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-white">Simple à utiliser. Puissant dans le temps.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-graphite-300">Chaque action nourrit la suivante : ta séance crée des données, tes données affinent tes décisions.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Target, title: "Choisis", text: "Ton objectif et la séance utile maintenant." },
                { icon: ClipboardList, title: "Enregistre", text: "Tes charges et ton ressenti en quelques secondes." },
                { icon: BarChart3, title: "Progresse", text: "Tes tendances deviennent lisibles." },
              ].map((etape, index) => {
                const Icon = etape.icon;
                return (
                  <div key={etape.title} className="rounded-xl border border-white/[0.08] bg-black/15 p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10 font-mono text-[10px] text-cyan-200">{index + 1}</span>
                      <Icon size={15} className="text-cyan-200" aria-hidden="true" />
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-white">{etape.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-graphite-400">{etape.text}</p>
                  </div>
                );
              })}
            </div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-laiton-300 transition hover:text-cyan-200">
              Revenir à mon tableau de bord <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </Card>

        <Card className="flex flex-col gap-5 border-laiton-400/25 bg-[linear-gradient(145deg,rgba(201,162,98,.11),rgba(255,255,255,.03))] p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SectionLabel>Pour aller plus loin</SectionLabel>
              <h2 className="mt-3 text-2xl font-semibold text-white">COAI Premium &amp; Elite</h2>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-laiton-400/30 bg-laiton-400/10 text-laiton-200">
              <Sparkles size={19} aria-hidden="true" />
            </span>
          </div>
          <p className="text-sm leading-6 text-graphite-300">COAI Free te permet de commencer. Premium débloque les outils IA et le suivi avancé ; Elite ajoute l’accompagnement VIP.</p>
          <ul className="flex flex-col gap-3">
            {PREMIUM_FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm leading-5 text-graphite-200">
                <Check size={16} className="mt-0.5 shrink-0 text-laiton-300" aria-hidden="true" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-col gap-3 border-t border-white/[0.08] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2 text-xs text-graphite-400">
              {hasPaidPlan ? <Watch size={15} className="text-cyan-200" aria-hidden="true" /> : <LockKeyhole size={15} className="text-laiton-300" aria-hidden="true" />}
              {hasPaidPlan ? "Fonctions avancées actives" : "Débloquer les fonctions avancées"}
            </span>
            <Link
              href={hasPaidPlan ? "/compte/abonnement" : "/pricing"}
              className={`inline-flex items-center justify-center rounded-full px-3 py-2 text-xs font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${
                hasPaidPlan
                  ? "border border-white/15 bg-white/[0.04] text-white hover:border-white/25 hover:bg-white/[0.08]"
                  : "bg-laiton-400 text-black shadow-[0_10px_25px_-14px_rgba(201,162,98,.9)] hover:bg-laiton-300"
              }`}
            >
              {hasPaidPlan ? `Gérer ${membershipLabel}` : "Voir les offres"}
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
