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
  { titre: "Catalogue de recettes", description: "164 recettes avec leurs macros, leurs étapes et leurs visuels.", href: "/programme/recettes", icon: Salad },
  { titre: "Suivi des macros", description: "Journal de repas et repères nutritionnels du jour.", href: "/suivi/alimentation", icon: Apple },
  { titre: "Vidéos de démonstration", description: "Les mouvements filmés en salle, à revoir avant chaque série.", href: "/videos", icon: Play },
  { titre: "Plan de récupération", description: "Mobilité, étirements, respiration et sommeil pour encaisser la charge.", href: "/programme/recuperation", icon: Moon },
  { titre: "Bilan quotidien", description: "Forme, sommeil, douleurs : deux minutes pour ajuster ta journée.", href: "/dashboard", icon: HeartPulse },
  { titre: "Analyse de ta montre", description: "Envoie une capture de ton app santé (Whoop, Oura, Garmin) : COAI en extrait tes indicateurs. Ce n’est pas une synchronisation automatique.", href: "/compte/profil", icon: Watch },
  { titre: "Parrainage", description: "Invite un proche et débloque une récompense sur ton abonnement.", href: "/compte/profil", icon: Gift },
];

const PAYANTES: Fonction[] = [
  { titre: "Programme généré par l’IA", description: "Ton programme d’entraînement construit sur ton profil, puis adapté chaque semaine selon tes retours.", href: "/programme/entrainement", icon: Brain },
  { titre: "Analyse d’un plat par photo", description: "Photographie ton assiette : COAI estime les portions et les macros.", href: "/programme/alimentation", icon: Camera },
  { titre: "Menu restaurant", description: "Photographie une carte : COAI te dit quoi commander selon ton objectif.", href: "/programme/alimentation", icon: UtensilsCrossed },
  { titre: "Catalogue complet de programmes", description: "Les 12 programmes prêts à l’emploi. Le programme Mobilité reste offert.", href: "/programme/programmes-prets", icon: Dumbbell },
  { titre: "Coaching humain", description: "Échange avec Anthony : ajustements, questions technique, suivi personnalisé.", href: "/coach", icon: MessageSquare },
];

function Bloc({ fonctions, verrouille }: { fonctions: Fonction[]; verrouille: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fonctions.map((f) => {
        const Icon = f.icon;
        return (
          <Link key={f.titre + f.href} href={f.href} className="group block">
            <Card className="h-full p-4 transition hover:border-white/20">
              <div className="flex items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${verrouille ? "border-laiton-300/25 bg-laiton-400/10" : "border-emerald-300/20 bg-emerald-400/10"}`}>
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
  return (
    <div className="flex flex-col gap-10">
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
