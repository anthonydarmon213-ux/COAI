"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { ScalePicker } from "@/components/ui/scale-picker";

type NiveauDouleur = "AUCUNE" | "LEGERE" | "IMPORTANTE";

const ZONES_DOULEUR = ["Dos", "Épaule", "Genou", "Cheville", "Poignet", "Hanche", "Cou", "Autre"];

const DOULEUR_OPTIONS: { value: NiveauDouleur; label: string }[] = [
  { value: "AUCUNE", label: "Aucune" },
  { value: "LEGERE", label: "Légère" },
  { value: "IMPORTANTE", label: "Importante" },
];

// Check-in post-séance (11/08/2026) — intégré directement au formulaire de
// log existant plutôt qu'un écran séparé : la cible COAI logue déjà sa
// séance ici, ajouter une étape distincte aurait dupliqué la friction.
// Objectif explicite : moins de 30 secondes à remplir, boutons plutôt que
// texte, tout facultatif.
export function SeanceForm() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [exercice, setExercice] = useState("");
  const [serieCharge, setSerieCharge] = useState("");
  const [serieRepetitions, setSerieRepetitions] = useState("");
  const [serieNotes, setSerieNotes] = useState("");
  const [duree, setDuree] = useState("");
  const [difficulte, setDifficulte] = useState<number | null>(null);
  const [energie, setEnergie] = useState<number | null>(null);
  const [douleur, setDouleur] = useState<NiveauDouleur | null>(null);
  const [douleurZone, setDouleurZone] = useState<string | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectDouleur(value: NiveauDouleur) {
    setDouleur(value);
    if (value === "AUCUNE") setDouleurZone(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const serie: { repetitions?: number; chargeKg?: number; notes?: string } = {};
      if (serieRepetitions) serie.repetitions = Number(serieRepetitions);
      if (serieCharge) serie.chargeKg = Number(serieCharge);
      if (serieNotes.trim()) serie.notes = serieNotes.trim();

      const exerciceRealise: {
        nom: string;
        series?: number;
        repetitions?: number;
        chargeKg?: number;
        sets?: { repetitions?: number; chargeKg?: number; notes?: string }[];
      } | null = exercice ? { nom: exercice } : null;

      if (exerciceRealise && Object.keys(serie).length > 0) {
        exerciceRealise.series = 1;
        exerciceRealise.sets = [serie];
        if (serie.repetitions !== undefined) exerciceRealise.repetitions = serie.repetitions;
        if (serie.chargeKg !== undefined) exerciceRealise.chargeKg = serie.chargeKg;
      }

      const res = await fetch("/api/seances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          exercices: exerciceRealise ? [exerciceRealise] : [],
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
      setExercice("");
      setSerieCharge("");
      setSerieRepetitions("");
      setSerieNotes("");
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

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Exercice principal">
          <Input
            type="text"
            placeholder="ex: squat 5x5"
            value={exercice}
            onChange={(e) => setExercice(e.target.value)}
          />
        </Field>
        <section className="rounded-2xl border border-laiton-400/20 bg-white/[0.03] p-4">
          <SectionLabel>Série 1 · réalisée</SectionLabel>
          <p className="mt-1 text-sm text-graphite-400">
            Renseigne ce que tu as réellement fait. Ces données alimentent ton journal.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Charge (kg)">
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="ex: 80"
                value={serieCharge}
                onChange={(e) => setSerieCharge(e.target.value)}
              />
            </Field>
            <Field label="Répétitions">
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="ex: 8"
                value={serieRepetitions}
                onChange={(e) => setSerieRepetitions(e.target.value)}
              />
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Note de série (facultatif)">
              <Input
                type="text"
                placeholder="ex: RPE 8, propre..."
                value={serieNotes}
                onChange={(e) => setSerieNotes(e.target.value)}
              />
            </Field>
          </div>
        </section>
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
  );
}
