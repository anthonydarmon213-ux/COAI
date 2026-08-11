"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdaptationResultat, type ResultatAdaptationUI } from "@/components/programme/adaptation-resultat";

type OptionContrainte =
  | "VOYAGE"
  | "MANQUE_TEMPS"
  | "SOMMEIL"
  | "FATIGUE"
  | "DOULEUR"
  | "MALADIE"
  | "SALLE"
  | "MATERIEL"
  | "EMPLOI_DU_TEMPS"
  | "AUTRE";

const OPTIONS: { value: OptionContrainte; label: string }[] = [
  { value: "VOYAGE", label: "Je voyage" },
  { value: "MANQUE_TEMPS", label: "Je manque de temps" },
  { value: "SOMMEIL", label: "Je dors mal" },
  { value: "FATIGUE", label: "Je suis très fatigué" },
  { value: "DOULEUR", label: "J'ai une douleur" },
  { value: "MALADIE", label: "Je suis malade" },
  { value: "SALLE", label: "Je change de salle" },
  { value: "MATERIEL", label: "Je n'ai pas mon matériel habituel" },
  { value: "EMPLOI_DU_TEMPS", label: "Mon emploi du temps change" },
  { value: "AUTRE", label: "Autre" },
];

const MATERIEL_VOYAGE = ["Aucun", "Poids du corps", "Élastiques", "Quelques haltères", "Salle d'hôtel", "Salle complète"];
const TEMPS_DISPO = ["15 min", "30 min", "45 min", "60 min"];
const OBJECTIF_VOYAGE = ["Maintenir", "Continuer à progresser", "Récupérer", "Bouger simplement"];
const ZONES_DOULEUR = ["Dos", "Épaule", "Genou", "Cheville", "Poignet", "Hanche", "Cou", "Autre"];
const DEPUIS_QUAND = ["Aujourd'hui", "Quelques jours", "Plus d'une semaine"];
const NB_SEANCES = ["1", "2", "3", "4", "5+"];

// "Ma semaine change" (Phase 2, 11/08/2026) — le bouton qui transforme COAI
// d'un générateur de programme en coach qui réagit à la vraie vie : prévenir
// AVANT que le programme ne devienne inadapté (voyage, fatigue, douleur...)
// plutôt que de laisser l'écart se creuser jusqu'au prochain check-in.
export function SemaineChangeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-sm font-medium text-graphite-100 transition hover:border-laiton-400/30 hover:bg-white/[0.06]"
      >
        <span aria-hidden="true">⚡</span> Ma semaine change
      </button>
      {open && <SemaineChangeModal onClose={() => setOpen(false)} />}
    </>
  );
}

function SemaineChangeModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [option, setOption] = useState<OptionContrainte | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultat, setResultat] = useState<ResultatAdaptationUI | null>(null);

  // Champs des sous-formulaires (un seul est pertinent à la fois selon
  // `option`, mais tout regroupé ici évite 5 useState({}) séparés).
  const [joursVoyage, setJoursVoyage] = useState("7");
  const [materielVoyage, setMaterielVoyage] = useState<string | null>(null);
  const [tempsVoyage, setTempsVoyage] = useState<string | null>(null);
  const [objectifVoyage, setObjectifVoyage] = useState<string | null>(null);

  const [nbSeances, setNbSeances] = useState<string | null>(null);
  const [tempsDispo, setTempsDispo] = useState<string | null>(null);

  const [zoneDouleur, setZoneDouleur] = useState<string | null>(null);
  const [intensiteDouleur, setIntensiteDouleur] = useState<"LEGERE" | "IMPORTANTE" | null>(null);
  const [depuisQuand, setDepuisQuand] = useState<string | null>(null);
  const [mouvementDeclencheur, setMouvementDeclencheur] = useState("");

  const [autreTexte, setAutreTexte] = useState("");

  function buildContrainteEtContexte(): { contrainte: string; contexte: Record<string, unknown>; joursTemporaire?: number; douleurSignaleeManuelle?: "LEGERE" | "IMPORTANTE" } | null {
    switch (option) {
      case "VOYAGE": {
        const jours = Number(joursVoyage) || 7;
        return {
          contrainte: `Je pars en voyage pendant ${jours} jour${jours > 1 ? "s" : ""}. Matériel disponible : ${materielVoyage ?? "non précisé"}. Temps disponible par séance : ${tempsVoyage ?? "non précisé"}. Objectif pendant le voyage : ${objectifVoyage ?? "maintenir"}.`,
          contexte: { type: "VOYAGE", jours, materiel: materielVoyage, temps: tempsVoyage, objectif: objectifVoyage },
          joursTemporaire: jours,
        };
      }
      case "MANQUE_TEMPS":
        return {
          contrainte: `Je manque de temps cette semaine : ${nbSeances ?? "un nombre réduit de"} séance(s) possible(s), ${tempsDispo ?? "moins de temps"} par séance. Condense temporairement mon programme sans le supprimer.`,
          contexte: { type: "MANQUE_TEMPS", seancesDisponibles: nbSeances, tempsDisponible: tempsDispo },
        };
      case "SOMMEIL":
        return {
          contrainte: "Je dors mal cette semaine. Adapte l'intensité de mon programme en conséquence (réduire légèrement plutôt que supprimer, sauf si la situation le justifie).",
          contexte: { type: "SOMMEIL" },
        };
      case "FATIGUE":
        return {
          contrainte: "Je suis très fatigué. Adapte mon programme (réduction de volume ou d'intensité, ou récupération active si nécessaire).",
          contexte: { type: "FATIGUE" },
        };
      case "DOULEUR":
        return {
          contrainte: `J'ai une douleur${zoneDouleur ? ` au niveau ${zoneDouleur.toLowerCase()}` : ""}, intensité ${intensiteDouleur === "IMPORTANTE" ? "importante" : "légère"}, depuis ${depuisQuand ?? "non précisé"}.${mouvementDeclencheur ? ` Mouvement déclencheur : ${mouvementDeclencheur}.` : ""} Évite temporairement les exercices sollicitant cette zone, réduis la charge si besoin, propose une variante prudente. Ne diagnostique jamais.`,
          contexte: { type: "DOULEUR", zone: zoneDouleur, intensite: intensiteDouleur, depuisQuand, mouvementDeclencheur: mouvementDeclencheur || null },
          douleurSignaleeManuelle: intensiteDouleur ?? "LEGERE",
        };
      case "MALADIE":
        return {
          contrainte: "Je suis malade. Réduis fortement l'intensité de mon programme, ou passe en récupération/repos si nécessaire.",
          contexte: { type: "MALADIE" },
        };
      case "SALLE":
        return {
          contrainte: "Je change de salle d'entraînement, le matériel disponible est peut-être différent. Garde le programme adaptable à un équipement standard.",
          contexte: { type: "SALLE" },
        };
      case "MATERIEL":
        return {
          contrainte: "Je n'ai pas mon matériel habituel cette semaine. Adapte mon programme à un équipement minimal.",
          contexte: { type: "MATERIEL" },
        };
      case "EMPLOI_DU_TEMPS":
        return {
          contrainte: "Mon emploi du temps change cette semaine. Adapte la répartition de mes séances si besoin.",
          contexte: { type: "EMPLOI_DU_TEMPS" },
        };
      case "AUTRE":
        if (!autreTexte.trim()) return null;
        return {
          contrainte: autreTexte.trim(),
          contexte: { type: "AUTRE", texte: autreTexte.trim() },
        };
      default:
        return null;
    }
  }

  async function handleSubmit() {
    const payload = buildContrainteEtContexte();
    if (!payload) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/programmes/entrainement/adapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contrainte: payload.contrainte,
          contexte: payload.contexte,
          joursTemporaire: payload.joursTemporaire,
          douleurSignaleeManuelle: payload.douleurSignaleeManuelle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'adaptation.");
      setResultat(data);
      if (data.nouvelleVersion) router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[90vh] w-full flex-col gap-5 overflow-y-auto rounded-t-3xl border border-white/[0.08] bg-[#0f1113] p-6 sm:max-w-md sm:rounded-3xl sm:p-8">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold text-white">Ma semaine change</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-graphite-500 transition hover:text-white"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {resultat ? (
          <div className="flex flex-col gap-2.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <AdaptationResultat resultat={resultat} />
          </div>
        ) : !option ? (
          <div className="flex flex-col gap-2">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setOption(o.value)}
                className="rounded-xl border border-graphite-800 px-4 py-3 text-left text-sm text-graphite-200 transition hover:border-laiton-400/30 hover:text-white"
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setOption(null)}
              className="self-start text-xs text-graphite-500 underline hover:text-white"
            >
              ← Changer de motif
            </button>

            {option === "VOYAGE" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-graphite-400">Durée du voyage (jours)</span>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={joursVoyage}
                    onChange={(e) => setJoursVoyage(e.target.value)}
                    className="rounded-lg border border-graphite-800 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-laiton-400/40"
                  />
                </div>
                <ChoixChips label="Matériel disponible" options={MATERIEL_VOYAGE} value={materielVoyage} onChange={setMaterielVoyage} />
                <ChoixChips label="Temps disponible par séance" options={TEMPS_DISPO} value={tempsVoyage} onChange={setTempsVoyage} />
                <ChoixChips label="Objectif pendant le voyage" options={OBJECTIF_VOYAGE} value={objectifVoyage} onChange={setObjectifVoyage} />
              </>
            )}

            {option === "MANQUE_TEMPS" && (
              <>
                <ChoixChips label="Combien de séances cette semaine ?" options={NB_SEANCES} value={nbSeances} onChange={setNbSeances} />
                <ChoixChips label="Durée disponible par séance" options={TEMPS_DISPO} value={tempsDispo} onChange={setTempsDispo} />
              </>
            )}

            {option === "DOULEUR" && (
              <>
                <ChoixChips label="Zone" options={ZONES_DOULEUR} value={zoneDouleur} onChange={setZoneDouleur} />
                <ChoixChips
                  label="Intensité"
                  options={["Légère", "Importante"]}
                  value={intensiteDouleur === "IMPORTANTE" ? "Importante" : intensiteDouleur === "LEGERE" ? "Légère" : null}
                  onChange={(v) => setIntensiteDouleur(v === "Importante" ? "IMPORTANTE" : "LEGERE")}
                />
                <ChoixChips label="Depuis quand ?" options={DEPUIS_QUAND} value={depuisQuand} onChange={setDepuisQuand} />
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-graphite-400">Mouvement déclencheur, si connu (facultatif)</span>
                  <input
                    type="text"
                    placeholder="ex: développé couché"
                    value={mouvementDeclencheur}
                    onChange={(e) => setMouvementDeclencheur(e.target.value)}
                    className="rounded-lg border border-graphite-800 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-laiton-400/40"
                  />
                </div>
                <p className="text-xs leading-5 text-graphite-500">
                  COAI ne remplace pas un professionnel de santé. Si la douleur est importante,
                  inhabituelle ou persistante, demande l&apos;avis d&apos;un professionnel.
                </p>
              </>
            )}

            {option === "AUTRE" && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-graphite-400">Décris ta situation</span>
                <input
                  type="text"
                  placeholder="ex: je reprends après une pause de 3 semaines"
                  value={autreTexte}
                  onChange={(e) => setAutreTexte(e.target.value)}
                  className="rounded-lg border border-graphite-800 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-laiton-400/40"
                />
              </div>
            )}

            {!["VOYAGE", "MANQUE_TEMPS", "DOULEUR", "AUTRE"].includes(option) && (
              <p className="text-sm text-graphite-400">
                COAI analysera ton programme d&apos;entraînement en tenant compte de cette
                information.
              </p>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Analyse en cours…" : "Envoyer à COAI"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChoixChips({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-graphite-400">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              value === o
                ? "border-laiton-400/50 bg-laiton-400/15 text-laiton-200"
                : "border-graphite-800 text-graphite-400 hover:text-white"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
