"use client";

import Link from "next/link";
import {
  Apple, BarChart3, BookOpen, Brain, Camera, ClipboardList, Dumbbell, Gift,
  HeartPulse, LockKeyhole, MessageSquare, Moon, Play, Ruler, Salad, Trophy,
  UtensilsCrossed, Watch, type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";

// Page « toutes les fonctions COAI » (01/09/2026, demande Anthony :
// « bien séparer les fonctions gratuites de base et les fonctions payantes »).
//
// Le classement gratuit/payant reflète les verrous RÉELS du code, pas une
// promesse commerciale : seules la génération de programme par l'IA
// (hasProgrammeAccess), l'analyse de repas et le menu restaurant
// (hasPaidSubscription) et le catalogue complet (hasCatalogueAccess) sont
// verrouillés aujourd'hui. Tout le reste est réellement accessible.
type Fonction = { titre: string; description: string; href: string; icon: LucideIcon };

const GRATUITES: Fonction[] = [
  { titre: "Suivi série par série", description: "Note chaque série : répétitions, charge, ressenti. Ton journal se remplit séance après séance.", href: "/suivi/seances", icon: ClipboardList },
  { titre: "Tonnage et volume", description: "Le poids total soulevé par séance et le volume par exercice, calculés automatiquement.", href: "/suivi/progression", icon: BarChart3 },
  { titre: "Records et tests maxi", description: "Garde la trace de tes maxima et vois tes records tomber.", href: "/suivi/tests-maxi", icon: Trophy },
  { titre: "Mesures corporelles", description: "Poids, tours de taille et de hanches, suivis dans le temps.", href: "/suivi/mesures", icon: Ruler },
  { titre: "Bibliothèque d’exercices", description: "77 exercices avec photos et vidéos de démonstration filmées par COAI.", href: "/programme/exercices", icon: BookOpen },
  { titre: "3 recettes offertes", description: "Goûte la bibliothèque : macros, étapes et visuels. Les 161 autres arrivent avec l’abonnement.", href: "/programme/recettes", icon: Salad },
  { titre: "Suivi des macros", description: "Journal de repas et repères nutritionnels du jour.", href: "/suivi/alimentation", icon: Apple },
  { titre: "Plan de récupération", description: "Mobilité, étirements, respiration et sommeil pour encaisser la charge.", href: "/programme/recuperation", icon: Moon },
  { titre: "Bilan quotidien", description: "Forme, sommeil, douleurs : deux minutes pour ajuster ta journée.", href: "/dashboard", icon: HeartPulse },
  { titre: "Parrainage", description: "Invite un proche et débloque une récompense sur ton abonnement.", href: "/compte/profil", icon: Gift },
];

const PAYANTES: Fonction[] = [
  { titre: "Programme généré par l’IA", description: "Ton programme d’entraînement construit sur ton profil, puis adapté chaque semaine selon tes retours.", href: "/programme/entrainement", icon: Brain },
  { titre: "Analyse d’un plat par photo", description: "Photographie ton assiette : COAI estime les portions et les macros.", href: "/programme/alimentation", icon: Camera },
  { titre: "Menu restaurant", description: "Photographie une carte : COAI te dit quoi commander selon ton objectif.", href: "/programme/alimentation", icon: UtensilsCrossed },
  { titre: "Catalogue complet de programmes", description: "Les 12 programmes prêts à l’emploi. Le programme Mobilité reste offert.", href: "/programme/programmes-prets", icon: Dumbbell },
  { titre: "Coaching humain", description: "Échange avec Anthony : ajustements, questions technique, suivi personnalisé.", href: "/coach", icon: MessageSquare },
  { titre: "Analyse de ta montre", description: "Envoie une capture de Whoop, Oura ou Garmin : COAI en extrait tes indicateurs. Lecture d’image, pas une synchronisation.", href: "/compte/profil", icon: Watch },
  { titre: "Vidéos exclusives", description: "Yoga, mobilité et récupération filmés par Anthony. Une séance de démonstration reste offerte.", href: "/videos", icon: Play },
  { titre: "Coach IA", description: "Pose tes questions technique, nutrition ou récupération : réponse immédiate, adaptée à ton profil.", href: "/coach", icon: Brain },
  { titre: "Bibliothèque complète de recettes", description: "Les 164 recettes, avec portions, conservation et variantes par programme.", href: "/programme/recettes", icon: Salad },
];

function Bloc({ fonctions, verrouille }: { fonctions: Fonction[]; verrouille: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fonctions.map((f, i) => {
        const Icon = f.icon;
        return (
          <Link key={f.titre + f.href} href={f.href} className="group block" style={{ ["--i" as string]: i }}>
            <Card
              className={`coai-fonction-card h-full p-4 ${verrouille ? "coai-fonction-verrouillee" : "coai-fonction-incluse"}`}
            >
              <div className="flex items-start gap-3">
                <span className={`coai-fonction-icone flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${verrouille ? "border-laiton-300/25 bg-laiton-400/10" : "border-emerald-300/20 bg-emerald-400/10"}`}>
                  <Icon size={17} className={verrouille ? "text-laiton-200" : "text-emerald-200"} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold text-[#fffdf8]">
                    {f.titre}
                    {verrouille && <LockKeyhole size={13} className="shrink-0 text-laiton-300" aria-label="Nécessite un abonnement" />}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-graphite-300">{f.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export function FonctionnalitesMenu({ abonne }: { abonne: boolean }) {
  const total = GRATUITES.length + PAYANTES.length;
  const pct = Math.round((abonne ? total : GRATUITES.length) / total * 100);

  return (
    <div className="flex flex-col gap-10">
      {/* Synthèse en tête, même langage que le tableau de bord : une jauge
          qui dit d'un coup d'œil ce qui est ouvert. */}
      <div className="animate-reveal rounded-2xl border border-white/10 bg-[linear-gradient(130deg,rgba(201,162,98,.10),rgba(76,201,240,.05),rgba(255,255,255,.02))] p-5">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-graphite-400">
            Ton accès COAI
          </p>
          <p className="font-display text-3xl font-extrabold text-[#fffdf8]">
            {pct}<span className="ml-0.5 text-base text-graphite-400">%</span>
          </p>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#c9a262)] transition-[width] duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-300/15 bg-emerald-400/[0.06] px-3 py-2.5">
            <p className="font-display text-xl font-bold text-emerald-200">{GRATUITES.length}</p>
            <p className="text-[10px] uppercase tracking-wide text-graphite-400">Incluses</p>
          </div>
          <div className="rounded-xl border border-laiton-300/20 bg-laiton-400/[0.07] px-3 py-2.5">
            <p className="font-display text-xl font-bold text-laiton-200">{PAYANTES.length}</p>
            <p className="text-[10px] uppercase tracking-wide text-graphite-400">Avec l&apos;abonnement</p>
          </div>
          <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 sm:col-span-1">
            <p className="font-display text-xl font-bold text-[#fffdf8]">{total}</p>
            <p className="text-[10px] uppercase tracking-wide text-graphite-400">Fonctions au total</p>
          </div>
        </div>
      </div>
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <SectionLabel>Inclus, sans abonnement</SectionLabel>
          <Badge tone="success">{GRATUITES.length} fonctions</Badge>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-graphite-300">
          Tu peux enregistrer tes séances, suivre tes charges et consulter toute la
          bibliothèque sans payer. C’est le cœur de COAI, et il reste ouvert.
        </p>
        <Bloc fonctions={GRATUITES} verrouille={false} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <SectionLabel>Avec l’abonnement</SectionLabel>
          <Badge tone={abonne ? "success" : "neutral"}>
            {abonne ? "Tu y as accès" : `${PAYANTES.length} fonctions`}
          </Badge>
        </div>
        <p className="max-w-2xl text-sm leading-6 text-graphite-300">
          {abonne
            ? "Ton abonnement est actif : ces fonctions sont débloquées."
            : "Ce que l’abonnement ajoute : l’intelligence qui adapte ton programme et lit tes repas, et l’accès au coaching."}
        </p>
        <Bloc fonctions={PAYANTES} verrouille={!abonne} />
        {!abonne && (
          <Link
            href="/pricing"
            className="self-start rounded-full bg-laiton-300 px-5 py-2.5 text-sm font-bold text-[#101214] transition hover:bg-laiton-200"
          >
            Voir les formules →
          </Link>
        )}
      </section>
    </div>
  );
}
