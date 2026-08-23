"use client";

import { useEffect, useState } from "react";
import { GROUPE_LABEL, GROUPES_MUSCULAIRES, NIVEAU_LABEL } from "@/lib/insight/recuperation-musculaire";

type GroupeMusculaire = (typeof GROUPES_MUSCULAIRES)[number];
type NiveauRecuperationMuscle = "COURBATURES_FORTES" | "COURBATURES_LEGERES" | "LEGERE_FATIGUE" | "FRAIS";

type EtatGroupe = {
  groupe: GroupeMusculaire;
  dernier: { niveau: NiveauRecuperationMuscle } | null;
  joursDepuis: number | null;
};

// Ordre du "moins récupéré" au "plus frais" — sert à la fois au menu de
// sélection et au nombre de crans allumés sur la barre de graduation
// (coai-muscle-scale), même logique que la jauge conique de
// ScoreAgeCoaiCard : plus le niveau est bon, plus la barre est remplie.
const NIVEAU_ORDER: NiveauRecuperationMuscle[] = ["COURBATURES_FORTES", "COURBATURES_LEGERES", "LEGERE_FATIGUE", "FRAIS"];

const NIVEAU_CRANS: Record<NiveauRecuperationMuscle, number> = {
  COURBATURES_FORTES: 1,
  COURBATURES_LEGERES: 2,
  LEGERE_FATIGUE: 3,
  FRAIS: 4,
};

const NIVEAU_COULEUR: Record<NiveauRecuperationMuscle, string> = {
  COURBATURES_FORTES: "border-red-500/40 bg-red-500/10 text-red-300",
  COURBATURES_LEGERES: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  LEGERE_FATIGUE: "border-laiton-400/40 bg-laiton-400/10 text-laiton-200",
  FRAIS: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

const NIVEAU_CRAN_COULEUR: Record<NiveauRecuperationMuscle, string> = {
  COURBATURES_FORTES: "bg-red-400",
  COURBATURES_LEGERES: "bg-amber-400",
  LEGERE_FATIGUE: "bg-laiton-300",
  FRAIS: "bg-emerald-400",
};

// Carte "Récupération musculaire" (19/08/2026, chantier demandé par
// Anthony). Purement déclaratif : chaque état vient d'un check-in que
// l'utilisateur a lui-même renseigné (POST /api/recuperation-musculaire),
// jamais déduit automatiquement des séances (cf. schema.prisma). Un groupe
// jamais renseigné affiche "Non renseigné", jamais une valeur par défaut.
export function RecuperationMusculaireCard() {
  const [etat, setEtat] = useState<EtatGroupe[] | null>(null);
  const [groupeOuvert, setGroupeOuvert] = useState<GroupeMusculaire | null>(null);
  const [loading, setLoading] = useState(false);

  function charger() {
    fetch("/api/recuperation-musculaire")
      .then((res) => res.json())
      .then((data) => setEtat(data.etat ?? null));
  }

  useEffect(() => {
    charger();
  }, []);

  async function logger(groupe: GroupeMusculaire, niveau: NiveauRecuperationMuscle) {
    setLoading(true);
    try {
      const res = await fetch("/api/recuperation-musculaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupe, niveau }),
      });
      if (res.ok) {
        setGroupeOuvert(null);
        charger();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!etat) return null;

  return (
    <section className="coai-vitality-panel animate-reveal px-5 py-6 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c49a52]">Récupération musculaire</p>
      </div>
      <p className="mt-2 max-w-md text-xs leading-5 text-graphite-400">
        Indique comment tu te sens, groupe par groupe. Toi seul(e) connais ton ressenti.
      </p>

      {/* 2 colonnes fixes (23/08/2026, signalé par Anthony : "Abdominaux"
          et "Mollets" se touchaient). La grille passait à 4 colonnes dès
          le palier sm:, qui dépend de la largeur de la FENÊTRE — or cette
          carte vit dans la colonne latérale étroite du dashboard
          (lg:col-span-4). Sur un grand écran, sm: était donc actif et
          tassait 4 cellules dans ~380px, faisant déborder les libellés
          longs. 2 colonnes × 4 lignes tiennent proprement à cette largeur. */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {etat.map(({ groupe, dernier, joursDepuis }) => {
          const crans = dernier ? NIVEAU_CRANS[dernier.niveau] : 0;
          const misAJourAujourdhui = joursDepuis === 0;
          return (
            <button
              key={groupe}
              type="button"
              onClick={() => setGroupeOuvert(groupeOuvert === groupe ? null : groupe)}
              className={`relative flex min-w-0 flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.07] ${
                groupeOuvert === groupe ? "ring-1 ring-laiton-300/60" : ""
              }`}
            >
              {misAJourAujourdhui && (
                <span className="absolute right-2 top-2 h-1.5 w-1.5 animate-status-pulse rounded-full bg-emerald-400" aria-hidden="true" />
              )}
              <span className="w-full text-xs font-semibold leading-tight text-[#fffdf8]">{GROUPE_LABEL[groupe]}</span>
              {/* Barre de graduation façon "signal" (19/08/2026, direction Whoop) :
                  4 crans, remplis de gauche à droite selon le niveau déclaré,
                  tous dans la même couleur que le niveau (pas un dégradé
                  arbitraire multi-teinte — un seul état à la fois, jamais deux
                  informations mélangées sur la même barre). */}
              <span className="flex gap-1" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 w-3.5 rounded-full transition-colors ${
                      dernier && i < crans ? NIVEAU_CRAN_COULEUR[dernier.niveau] : "bg-white/10"
                    }`}
                  />
                ))}
              </span>
              <span className="w-full text-[10px] leading-tight text-graphite-400">
                {dernier
                  ? `${NIVEAU_LABEL[dernier.niveau]}${misAJourAujourdhui ? " · aujourd'hui" : joursDepuis === 1 ? " · hier" : ` · il y a ${joursDepuis} j`}`
                  : "Non renseigné"}
              </span>
            </button>
          );
        })}
      </div>

      {groupeOuvert && (
        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
          <span className="text-xs text-graphite-300">Ton ressenti pour {GROUPE_LABEL[groupeOuvert].toLowerCase()} aujourd&apos;hui :</span>
          <div className="flex flex-wrap gap-2">
            {NIVEAU_ORDER.map((niveau) => (
              <button
                key={niveau}
                type="button"
                disabled={loading}
                onClick={() => logger(groupeOuvert, niveau)}
                className={`rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-50 ${NIVEAU_COULEUR[niveau]}`}
              >
                {NIVEAU_LABEL[niveau]}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-graphite-500">Ce n&apos;est pas une consigne médicale, juste un repère pour doser ta prochaine séance.</p>
        </div>
      )}
    </section>
  );
}
