import Link from "next/link";
import { Apple, Dumbbell, MoonStar, Repeat2, type LucideIcon } from "lucide-react";
import { objectifSocle, type ObjectifSocle } from "@/lib/programmes-socles/cle";
import type { CompletionProfil } from "@/lib/profil/completion";

type Etape = {
  numero: number;
  titre: string;
  detail: string;
  faite: boolean;
  href: string;
  action?: string;
};

const OBJECTIF_INFO: Record<ObjectifSocle, { label: string; promesse: string; couleur: string }> = {
  PERTE: {
    label: "Perdre du gras",
    promesse: "Construire une perte progressive, sans méthode extrême.",
    couleur: "text-orange-200",
  },
  MUSCLE: {
    label: "Prendre du muscle",
    promesse: "Développer ta force et ta masse avec un volume maîtrisé.",
    couleur: "text-violet-200",
  },
  PERFORMANCE: {
    label: "Développer mes performances",
    promesse: "Faire monter tes capacités sans sacrifier ta récupération.",
    couleur: "text-cyan-200",
  },
  FORME: {
    label: "Retrouver la forme",
    promesse: "Installer une routine durable qui s’adapte à ta vraie vie.",
    couleur: "text-emerald-200",
  },
};

const OBJECTIF_NON_RENSEIGNE = {
  label: "Définir mon objectif",
  promesse: "Choisis un cap clair pour que COAI puisse construire le chemin le plus utile pour toi.",
  couleur: "text-laiton-100",
};

function texteCourt(value: string | null | undefined) {
  const texte = value?.trim();
  if (!texte) return null;
  return texte.length > 150 ? `${texte.slice(0, 147).trim()}…` : texte;
}

export function ObjectifCheminCard({
  objectifs,
  completion,
  hasProgramme,
  hasNutrition,
  hasRecovery,
  hasAccess,
  premiereSeanceFaite,
  seancesDuMois,
}: {
  objectifs?: string | null;
  completion: CompletionProfil;
  hasProgramme: boolean;
  hasNutrition: boolean;
  hasRecovery: boolean;
  hasAccess: boolean;
  premiereSeanceFaite: boolean;
  seancesDuMois: number;
}) {
  const objectifLibre = texteCourt(objectifs);
  const info = objectifLibre ? OBJECTIF_INFO[objectifSocle(objectifs)] : OBJECTIF_NON_RENSEIGNE;
  const etapes: Etape[] = [
    {
      numero: 1,
      titre: "Ton point de départ",
      detail: completion.essentielComplet ? "Profil essentiel renseigné" : "Quelques repères sont encore nécessaires",
      faite: completion.essentielComplet,
      href: "/compte/profil?onboarding=1",
      action: completion.essentielComplet ? "Voir mon profil" : "Compléter",
    },
    {
      numero: 2,
      titre: "Ton programme adapté",
      detail: hasProgramme
        ? "Programme actif dans ton espace"
        : hasAccess
          ? "Ton accès est prêt : génère maintenant ton programme"
          : "Choisis ton accompagnement pour le débloquer",
      faite: hasProgramme,
      href: hasProgramme ? "/programme" : hasAccess ? "#programme-a-generer" : "/pricing",
      action: hasProgramme ? "Ouvrir" : hasAccess ? "Générer" : "Choisir",
    },
    {
      numero: 3,
      titre: "Ta première séance",
      detail: premiereSeanceFaite ? "Première séance enregistrée" : "Lance une séance et donne à COAI un premier repère",
      faite: premiereSeanceFaite,
      href: premiereSeanceFaite ? "/suivi/progression" : "#check-in-du-jour",
      action: premiereSeanceFaite ? "Voir ma progression" : "Commencer",
    },
    {
      numero: 4,
      titre: "Installer ta régularité",
      detail: seancesDuMois >= 4 ? "Ton rythme est lancé : continue à nourrir le suivi" : `${seancesDuMois}/4 séances réalisées ce mois`,
      faite: seancesDuMois >= 4,
      href: "/suivi/seances",
      action: seancesDuMois >= 4 ? "Continuer" : "Avancer",
    },
  ];
  const etapesFaites = etapes.filter((etape) => etape.faite).length;
  const prochaineEtape = etapes.findIndex((etape) => !etape.faite);
  const piliers: {
    titre: string;
    detail: string;
    actif: boolean;
    href: string;
    Icone: LucideIcon;
    couleur: "cyan" | "gold" | "violet" | "green";
  }[] = [
    {
      titre: "Entraînement",
      detail: hasProgramme ? "Plan actif" : "À construire",
      actif: hasProgramme,
      href: "/programme/entrainement",
      Icone: Dumbbell,
      couleur: "cyan",
    },
    {
      titre: "Alimentation",
      detail: hasNutrition ? "Repères actifs" : "À activer",
      actif: hasNutrition,
      href: "/programme/alimentation",
      Icone: Apple,
      couleur: "gold",
    },
    {
      titre: "Récupération",
      detail: hasRecovery ? "Protocole actif" : "À activer",
      actif: hasRecovery,
      href: "/programme/recuperation",
      Icone: MoonStar,
      couleur: "violet",
    },
    {
      titre: "Régularité",
      detail: `${seancesDuMois}/4 séances ce mois`,
      actif: seancesDuMois >= 4,
      href: "/suivi/seances",
      Icone: Repeat2,
      couleur: "green",
    },
  ];
  const prochaine = etapes[prochaineEtape] ?? etapes.at(-1)!;

  return (
    <section
      className="animate-reveal overflow-hidden rounded-[1.75rem] border border-laiton-400/30 bg-[linear-gradient(135deg,rgba(201,162,98,.12),rgba(255,255,255,.035)_48%,rgba(255,255,255,.02))] p-6 shadow-[0_24px_70px_-46px_rgba(201,162,98,.6)] sm:p-8"
      aria-labelledby="objectif-chemin-title"
    >
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-laiton-300">Ton cap COAI</p>
            <span className="rounded-full border border-white/10 bg-black/15 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-graphite-300">
              {etapesFaites}/{etapes.length} étapes
            </span>
          </div>
          <h2 id="objectif-chemin-title" className={`mt-2 font-editorial text-3xl sm:text-4xl ${info.couleur}`}>
            {info.label}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-200">{info.promesse}</p>
          {objectifLibre && (
            <p className="mt-3 max-w-2xl border-l border-laiton-400/45 pl-3 text-xs leading-5 text-graphite-400">
              Ton objectif déclaré : <span className="text-graphite-200">{objectifLibre}</span>
            </p>
          )}
        </div>

        <Link
          href="/compte/profil#objectifs"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-laiton-400/45 bg-laiton-400/[0.12] px-5 py-2.5 text-sm font-bold text-laiton-100 transition hover:-translate-y-0.5 hover:bg-laiton-400/[0.2]"
        >
          Modifier mon objectif →
        </Link>
      </div>

      <div className="coai-trajectory-map mt-7" aria-label="Les quatre piliers de ton objectif">
        <div className="coai-trajectory-lines" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
        <div className="coai-trajectory-core">
          <span className="coai-trajectory-core-orbit" aria-hidden="true" />
          <small>Ton cap</small>
          <strong>{info.label}</strong>
          <span>{etapesFaites}/{etapes.length} étapes</span>
        </div>
        <div className="coai-trajectory-pillars">
          {piliers.map(({ titre, detail, actif, href, Icone, couleur }) => (
            <Link key={titre} href={href} className={`coai-trajectory-pillar coai-trajectory-${couleur}`}>
              <span className="coai-trajectory-pillar-icon"><Icone size={18} strokeWidth={1.8} aria-hidden="true" /></span>
              <div>
                <strong>{titre}</strong>
                <small>{detail}</small>
              </div>
              <i className={actif ? "is-active" : ""} aria-label={actif ? "Actif" : "À activer"} />
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-1" aria-label="Marches vers ton objectif">
        {etapes.map((etape, index) => (
          <div key={etape.numero} className={`coai-path-step ${etape.faite ? "is-done" : index === prochaineEtape ? "is-next" : ""}`}>
            <span>{etape.faite ? "✓" : etape.numero}</span>
            <small>{index === 0 ? "Profil" : index === 1 ? "Plan" : index === 2 ? "Séance" : "Adaptation"}</small>
          </div>
        ))}
      </div>

      <Link href={prochaine.href} className="coai-next-mission mt-4 flex items-center justify-between gap-4 rounded-2xl px-4 py-3.5 transition hover:-translate-y-0.5">
        <div>
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-laiton-200">Prochaine marche</p>
          <p className="mt-1 text-sm font-semibold text-white">{prochaine.titre}</p>
          <p className="mt-0.5 text-xs text-graphite-400">{prochaine.detail}</p>
        </div>
        <span className="shrink-0 text-sm font-bold text-laiton-100">{prochaine.action} →</span>
      </Link>
    </section>
  );
}
