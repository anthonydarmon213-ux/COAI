import Link from "next/link";
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
  premiereSeanceFaite,
}: {
  objectifs?: string | null;
  completion: CompletionProfil;
  hasProgramme: boolean;
  premiereSeanceFaite: boolean;
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
      detail: hasProgramme ? "Programme actif dans ton espace" : "Choisis ton accompagnement pour le débloquer",
      faite: hasProgramme,
      href: hasProgramme ? "/programme" : "/pricing",
      action: hasProgramme ? "Ouvrir" : "Choisir",
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
      titre: "Ajuster jusqu’au résultat",
      detail: "Check-in, charges et mesures pour faire évoluer le plan",
      faite: false,
      href: "/suivi/progression",
      action: "Voir le suivi",
    },
  ];
  const etapesFaites = etapes.filter((etape) => etape.faite).length;

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

      <div className="mt-7 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Chemin vers ton objectif">
        {etapes.map((etape) => (
          <Link
            key={etape.numero}
            href={etape.href}
            className={`group relative rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
              etape.faite
                ? "border-emerald-300/25 bg-emerald-300/[0.06]"
                : "border-white/[0.1] bg-black/[0.12] hover:border-laiton-400/35"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-bold ${
                  etape.faite
                    ? "border-emerald-300/40 bg-emerald-300/15 text-emerald-200"
                    : "border-laiton-400/35 bg-laiton-400/10 text-laiton-200"
                }`}
              >
                {etape.faite ? "✓" : etape.numero}
              </span>
              <span className="text-xs text-graphite-500 transition group-hover:text-laiton-200">{etape.action} ↗</span>
            </div>
            <h3 className="mt-4 text-sm font-bold text-white">{etape.titre}</h3>
            <p className="mt-1 text-xs leading-5 text-graphite-400">{etape.detail}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/[0.08]" aria-hidden="true">
        <div
          className="h-full rounded-full bg-gradient-to-r from-laiton-500 via-laiton-300 to-emerald-300 transition-all"
          style={{ width: `${Math.max(8, (etapesFaites / etapes.length) * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] text-graphite-500">
        {etapesFaites === etapes.length ? "Ton chemin est lancé : continue à nourrir ton suivi." : "Chaque étape validée rend le prochain ajustement plus précis."}
      </p>
    </section>
  );
}
