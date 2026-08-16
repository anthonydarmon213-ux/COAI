"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { SectionLabel } from "@/components/ui/section-label";
import { ScalePicker } from "@/components/ui/scale-picker";

const SOMMEIL_OPTIONS: { value: string; label: string }[] = [
  { value: "TRES_MAUVAIS", label: "Très mauvais" },
  { value: "MAUVAIS", label: "Mauvais" },
  { value: "CORRECT", label: "Correct" },
  { value: "BON", label: "Bon" },
  { value: "EXCELLENT", label: "Excellent" },
];

// Carte "Ton check-in de la semaine" (11/08/2026) — ne s'affiche que si
// aucun check-in n'existe pour la semaine en cours (GET /api/check-in-hebdo),
// pour ne jamais réclamer un check-in déjà fait. Objectif : moins d'une
// minute à remplir, tout facultatif.
export function WeeklyCheckinCard() {
  const router = useRouter();
  const [du, setDu] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/check-in-hebdo")
      .then((res) => res.json())
      .then((data) => setDu(Boolean(data.du)))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || !du) return null;

  return (
    <>
      <Card className="flex flex-col gap-3 border-[#d9c9ac] bg-[#fffdf8] text-[#171713] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a6d2f]">Bilan hebdomadaire</p>
          <h2 className="mt-1 text-lg font-bold">Ta semaine en 60 secondes.</h2>
          <p className="mt-1 text-sm text-[#666159]">
            Moins d&apos;une minute — ça aide COAI à ajuster ton programme.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="shrink-0">
          Commencer
        </Button>
      </Card>
      {open && <WeeklyCheckinModal onClose={() => setOpen(false)} onDone={() => { setDu(false); router.refresh(); }} />}
    </>
  );
}

function WeeklyCheckinModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [sommeil, setSommeil] = useState("");
  const [energie, setEnergie] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [faim, setFaim] = useState<number | null>(null);
  const [motivation, setMotivation] = useState<number | null>(null);
  const [poidsKg, setPoidsKg] = useState("");
  const [douleurs, setDouleurs] = useState<boolean | null>(null);
  const [seancesRealisees, setSeancesRealisees] = useState("");
  const [repasMaison, setRepasMaison] = useState("");
  const [repasRestaurant, setRepasRestaurant] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/check-in-hebdo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sommeil: sommeil || undefined,
          energie: energie ?? undefined,
          stress: stress ?? undefined,
          faim: faim ?? undefined,
          motivation: motivation ?? undefined,
          poidsKg: poidsKg ? Number(poidsKg) : undefined,
          douleurs: douleurs ?? undefined,
          seancesRealisees: seancesRealisees ? Number(seancesRealisees) : undefined,
          repasMaison: repasMaison ? Number(repasMaison) : undefined,
          repasRestaurant: repasRestaurant ? Number(repasRestaurant) : undefined,
          commentaire: commentaire || undefined,
        }),
      });
      if (!res.ok) throw new Error("Échec de l'envoi.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[90vh] w-full flex-col gap-5 overflow-y-auto rounded-t-3xl border border-[#d9c9ac] bg-[#fffdf8] p-6 text-[#171713] shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-8">
        <div className="flex items-start justify-between">
          <div>
            <SectionLabel>Bilan de la semaine</SectionLabel>
            <h2 className="mt-1 text-xl font-bold">Ton check-in de la semaine</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-[#756f66] transition hover:text-black"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <Field label="Sommeil moyen">
          <Select value={sommeil} onChange={(e) => setSommeil(e.target.value)}>
            <option value="">Non renseigné</option>
            {SOMMEIL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-graphite-400">Énergie</span>
          <ScalePicker value={energie} onChange={setEnergie} labelMin="Faible" labelMax="Élevée" />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-graphite-400">Stress</span>
          <ScalePicker value={stress} onChange={setStress} labelMin="Faible" labelMax="Élevé" />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-graphite-400">Faim</span>
          <ScalePicker value={faim} onChange={setFaim} labelMin="Faible" labelMax="Élevée" />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-graphite-400">Motivation</span>
          <ScalePicker value={motivation} onChange={setMotivation} labelMin="Faible" labelMax="Élevée" />
        </div>

        <Field label="Poids (kg, facultatif)">
          <Input
            type="number"
            min="0"
            step="0.1"
            placeholder="ex: 78.5"
            value={poidsKg}
            onChange={(e) => setPoidsKg(e.target.value)}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-graphite-400">Douleurs cette semaine ?</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDouleurs(false)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                douleurs === false
                  ? "border-laiton-400/50 bg-laiton-400/15 text-laiton-200"
                  : "border-graphite-800 text-graphite-400 hover:text-white"
              }`}
            >
              Non
            </button>
            <button
              type="button"
              onClick={() => setDouleurs(true)}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                douleurs === true
                  ? "border-amber-600/60 bg-amber-500/10 text-amber-300"
                  : "border-graphite-800 text-graphite-400 hover:text-white"
              }`}
            >
              Oui
            </button>
          </div>
        </div>

        <Field label="Séances réalisées cette semaine">
          <Input
            type="number"
            min="0"
            max="14"
            placeholder="ex: 3"
            value={seancesRealisees}
            onChange={(e) => setSeancesRealisees(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Repas à la maison">
            <Input type="number" min="0" max="21" placeholder="ex : 10" value={repasMaison} onChange={(e) => setRepasMaison(e.target.value)} />
          </Field>
          <Field label="Repas au restaurant / dehors">
            <Input type="number" min="0" max="21" placeholder="ex : 3" value={repasRestaurant} onChange={(e) => setRepasRestaurant(e.target.value)} />
          </Field>
        </div>

        <Field label="Comment s'est passée ta semaine ? (facultatif)">
          <Input
            type="text"
            placeholder="ex: semaine chargée au travail…"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
        </Field>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Envoi…" : "Envoyer mon check-in"}
        </Button>
      </div>
    </div>
  );
}
