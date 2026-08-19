"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { GROUPE_LABEL, GROUPES_MUSCULAIRES, NIVEAU_LABEL } from "@/lib/insight/recuperation-musculaire";

type GroupeMusculaire = (typeof GROUPES_MUSCULAIRES)[number];
type NiveauRecuperationMuscle = "COURBATURES_FORTES" | "COURBATURES_LEGERES" | "LEGERE_FATIGUE" | "FRAIS";

type EtatGroupe = {
  groupe: GroupeMusculaire;
  dernier: { niveau: NiveauRecuperationMuscle } | null;
  joursDepuis: number | null;
};

const NIVEAU_ORDER: NiveauRecuperationMuscle[] = ["COURBATURES_FORTES", "COURBATURES_LEGERES", "LEGERE_FATIGUE", "FRAIS"];

const NIVEAU_COULEUR: Record<NiveauRecuperationMuscle, string> = {
  COURBATURES_FORTES: "border-red-500/40 bg-red-500/10 text-red-300",
  COURBATURES_LEGERES: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  LEGERE_FATIGUE: "border-laiton-400/40 bg-laiton-400/10 text-laiton-200",
  FRAIS: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
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
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-white">Récupération musculaire</h2>
        <p className="mt-1 text-xs text-graphite-400">Indique comment tu te sens, groupe par groupe. Toi seul(e) connais ton ressenti.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {etat.map(({ groupe, dernier, joursDepuis }) => (
          <button
            key={groupe}
            type="button"
            onClick={() => setGroupeOuvert(groupeOuvert === groupe ? null : groupe)}
            className={`flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition ${
              dernier ? NIVEAU_COULEUR[dernier.niveau] : "border-graphite-800 text-graphite-400 hover:text-white"
            } ${groupeOuvert === groupe ? "ring-1 ring-laiton-400/60" : ""}`}
          >
            <span className="text-xs font-semibold">{GROUPE_LABEL[groupe]}</span>
            <span className="text-[10px] opacity-80">
              {dernier
                ? `${NIVEAU_LABEL[dernier.niveau]}${joursDepuis === 0 ? " · aujourd'hui" : joursDepuis === 1 ? " · hier" : ` · il y a ${joursDepuis} j`}`
                : "Non renseigné"}
            </span>
          </button>
        ))}
      </div>

      {groupeOuvert && (
        <div className="flex flex-col gap-2 rounded-xl border border-graphite-800 bg-white/[0.02] p-3">
          <span className="text-xs text-graphite-400">Ton ressenti pour {GROUPE_LABEL[groupeOuvert].toLowerCase()} aujourd&apos;hui :</span>
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
    </Card>
  );
}
