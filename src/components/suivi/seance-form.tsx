"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { ScalePicker } from "@/components/ui/scale-picker";
import { RoutinesPanel, type ExerciceRoutine } from "@/components/suivi/routines-panel";

type NiveauDouleur = "AUCUNE" | "LEGERE" | "IMPORTANTE";
type SetEntry = { reps: string; charge: string };
type ExerciceEntry = { nom: string; sets: SetEntry[] };

const ZONES_DOULEUR = ["Dos", "Épaule", "Genou", "Cheville", "Poignet", "Hanche", "Cou", "Autre"];

const DOULEUR_OPTIONS: { value: NiveauDouleur; label: string }[] = [
  { value: "AUCUNE", label: "Aucune" },
  { value: "LEGERE", label: "Légère" },
  { value: "IMPORTANTE", label: "Importante" },
];

function newSet(): SetEntry {
  return { reps: "", charge: "" };
}

function newExercice(): ExerciceEntry {
  return { nom: "", sets: [newSet()] };
}

// `exercicesConnus` vient du serveur (page /suivi/seances) et ne contient
// que les noms d'exercices réellement démontrés. Passé en prop plutôt
// qu'importé ici : importer le catalogue dans un composant client
// embarquerait les 77 fiches et leurs consignes dans le bundle.
//
// Volontairement un <datalist> et non un <select> : la saisie libre reste
// possible pour un mouvement absent du catalogue, mais la proposition
// oriente vers un nom reconnu — condition pour que la fiche affiche sa
// photo et sa vidéo.
export function SeanceForm({ exercicesConnus = [] }: { exercicesConnus?: string[] }) {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [exercices, setExercices] = useState<ExerciceEntry[]>([newExercice()]);
  const [duree, setDuree] = useState("");
  const [difficulte, setDifficulte] = useState<number | null>(null);
  const [energie, setEnergie] = useState<number | null>(null);
  const [douleur, setDouleur] = useState<NiveauDouleur | null>(null);
  const [douleurZone, setDouleurZone] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateExercice(idx: number, patch: Partial<ExerciceEntry>) {
    setExercices((prev) => prev.map((ex, i) => (i === idx ? { ...ex, ...patch } : ex)));
  }

  function updateSet(exIdx: number, setIdx: number, patch: Partial<SetEntry>) {
    setExercices((prev) =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) }
          : ex
      )
    );
  }

  function addSet(exIdx: number) {
    setExercices((prev) =>
      prev.map((ex, i) => (i === exIdx ? { ...ex, sets: [...ex.sets, newSet()] } : ex))
    );
  }

  function removeSet(exIdx: number, setIdx: number) {
    setExercices((prev) =>
      prev.map((ex, i) =>
        i === exIdx && ex.sets.length > 1
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) }
          : ex
      )
    );
  }

  function addExercice() {
    setExercices((prev) => [...prev, newExercice()]);
  }

  function removeExercice(idx: number) {
    if (exercices.length <= 1) return;
    setExercices((prev) => prev.filter((_, i) => i !== idx));
  }

  function selectDouleur(value: NiveauDouleur) {
    setDouleur(value);
    if (value === "AUCUNE") setDouleurZone(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = exercices
        .filter((ex) => ex.nom.trim())
        .map((ex) => {
          const sets = ex.sets
            .map((s, i) => ({
              set: i + 1,
              reps: Number(s.reps) || 0,
              charge: Number(s.charge) || 0,
            }))
            .filter((s) => s.reps > 0);
          const totalSeries = sets.length || ex.sets.length;
          const lastCharge = sets.at(-1)?.charge;
          return {
            nom: ex.nom.trim(),
            series: totalSeries,
            chargeKg: lastCharge,
            sets: sets.length > 0 ? sets : undefined,
          };
        });

      const res = await fetch("/api/seances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          exercices: payload,
          notes: commentaire || undefined,
          difficulte: difficulte ?? undefined,
          energie: energie ?? undefined,
          douleur: douleur ?? undefined,
          douleurZone: douleurZone ?? undefined,
          dureeMinutes: duree ? Number(duree) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : "Échec de l'ajout.");
      setExercices([newExercice()]);
      setDuree("");
      setDifficulte(null);
      setEnergie(null);
      setDouleur(null);
      setDouleurZone(null);
      setCommentaire("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  // Préremplissage depuis une routine : on crée autant de séries vides que
  // la routine en prévoit, prêtes à recevoir reps et charge. Remplace la
  // saisie en cours plutôt que de s'y ajouter — l'utilisateur choisit une
  // routine pour partir d'elle, pas pour l'empiler sur un brouillon.
  function appliquerRoutine(liste: ExerciceRoutine[], nomRoutine: string) {
    setExercices(
      liste.map((e) => ({
        nom: e.nom,
        sets: Array.from({ length: Math.max(1, e.series ?? 3) }, () => newSet()),
      }))
    );
    setCommentaire((c: string) => (c.trim().length > 0 ? c : `Routine : ${nomRoutine}`));
  }

  return (
    <>
      <div className="mb-4">
        <RoutinesPanel onUtiliser={appliquerRoutine} />
      </div>
    <Card>
      {/* Une seule datalist pour tous les champs d'exercice du formulaire :
          la dupliquer par exercice ajouterait N fois la même liste au DOM. */}
      <datalist id="coai-exercices">
        {exercicesConnus.map((nom) => (
          <option key={nom} value={nom} />
        ))}
      </datalist>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <div className="flex flex-col gap-4">
          <SectionLabel>Exercices</SectionLabel>
          {exercices.map((ex, exIdx) => (
            <div
              key={exIdx}
              className="relative flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3"
            >
              {exercices.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExercice(exIdx)}
                  className="absolute right-2 top-2 text-xs text-graphite-500 hover:text-red-400"
                >
                  ✕
                </button>
              )}
              <Input
                type="text"
                list="coai-exercices"
                autoComplete="off"
                placeholder="Nom de l'exercice — commence à taper"
                value={ex.nom}
                onChange={(e) => updateExercice(exIdx, { nom: e.target.value })}
              />
              <div className="flex flex-col gap-1.5">
                {ex.sets.map((s, setIdx) => (
                  <div key={setIdx} className="flex items-center gap-2">
                    <span className="w-6 text-center font-mono text-[10px] text-graphite-500">
                      S{setIdx + 1}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Reps"
                      value={s.reps}
                      onChange={(e) => updateSet(exIdx, setIdx, { reps: e.target.value })}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="kg"
                      value={s.charge}
                      onChange={(e) => updateSet(exIdx, setIdx, { charge: e.target.value })}
                      className="flex-1"
                    />
                    {ex.sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSet(exIdx, setIdx)}
                        className="text-xs text-graphite-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSet(exIdx)}
                  className="self-start rounded-lg border border-dashed border-graphite-700 px-3 py-1.5 text-[11px] text-graphite-400 hover:border-laiton-400/40 hover:text-laiton-300"
                >
                  + Série
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addExercice}
            className="self-start rounded-lg border border-dashed border-graphite-700 px-4 py-2 text-xs text-graphite-400 hover:border-laiton-400/40 hover:text-laiton-300"
          >
            + Exercice
          </button>
        </div>

        <Field label="Durée de la séance (minutes, facultatif)">
          <Input
            type="number"
            min="0"
            step="5"
            placeholder="ex: 50"
            value={duree}
            onChange={(e) => setDuree(e.target.value)}
          />
        </Field>

        <div className="flex flex-col gap-4 border-t border-graphite-800 pt-4">
          <SectionLabel>Bilan rapide</SectionLabel>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-graphite-400">Difficulté de la séance</span>
            <ScalePicker
              value={difficulte}
              onChange={setDifficulte}
              labelMin="Très facile"
              labelMax="Très difficile"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-graphite-400">Énergie</span>
            <ScalePicker value={energie} onChange={setEnergie} labelMin="À plat" labelMax="En forme" />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-graphite-400">Douleur</span>
            <div className="flex gap-2">
              {DOULEUR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => selectDouleur(opt.value)}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                    douleur === opt.value
                      ? opt.value === "AUCUNE"
                        ? "border-laiton-400/50 bg-laiton-400/15 text-laiton-200"
                        : "border-amber-600/60 bg-amber-500/10 text-amber-300"
                      : "border-graphite-800 text-graphite-400 hover:border-graphite-700 hover:text-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {(douleur === "LEGERE" || douleur === "IMPORTANTE") && (
              <div className="mt-1 flex flex-wrap gap-2">
                {ZONES_DOULEUR.map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setDouleurZone(zone)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      douleurZone === zone
                        ? "border-amber-600/60 bg-amber-500/10 text-amber-300"
                        : "border-graphite-800 text-graphite-400 hover:text-white"
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Field label="Une remarque sur ta séance ? (facultatif)">
            <Input
              type="text"
              placeholder="ex: bonne forme, séance rapide…"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />
          </Field>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Ajout…" : "Ajouter la séance"}
        </Button>
      </form>
    </Card>
    </>
  );
}
