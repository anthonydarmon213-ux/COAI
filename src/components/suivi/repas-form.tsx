"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const STATUTS = [
  { value: "COMME_PREVU", label: "Comme prévu" },
  { value: "PETIT_ECART", label: "Petit écart" },
  { value: "GROS_ECART", label: "Gros écart" },
] as const;

// Check-in rapide (3 boutons) plutôt qu'un journal alimentaire complet à
// remplir à chaque repas — cohérent avec la cible COAI (débutants,
// sédentaires déjà submergés), et suffisant pour repérer une tendance sur
// la semaine sans demander de peser/lister chaque aliment.
// Chaîne vide ou invalide -> undefined, jamais 0.
function entier(v: string): number | undefined {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function RepasForm() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [statut, setStatut] = useState<(typeof STATUTS)[number]["value"] | null>(null);
  const [notes, setNotes] = useState("");
  // Macros facultatifs : chaînes en état, converties à l'envoi. Stocker des
  // nombres obligerait à gérer NaN à chaque frappe pendant que le champ est
  // vide ou en cours de saisie.
  const [libelle, setLibelle] = useState("");
  const [calories, setCalories] = useState("");
  const [proteines, setProteines] = useState("");
  const [glucides, setGlucides] = useState("");
  const [lipides, setLipides] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!statut) {
      setError("Choisis comment s'est passée ta journée.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/repas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          statut,
          notes: notes || undefined,
          libelle: libelle.trim() || undefined,
          // undefined plutôt que 0 quand le champ est vide : un champ non
          // renseigné n'est pas un repas à zéro calorie.
          calories: entier(calories),
          proteines: entier(proteines),
          glucides: entier(glucides),
          lipides: entier(lipides),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : "Échec de l'ajout.");
      setStatut(null);
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Comment s'est passée ta journée nutrition ?">
          <div className="flex flex-wrap gap-2">
            {STATUTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatut(s.value)}
                aria-pressed={statut === s.value}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  statut === s.value
                    ? "border-laiton-400/50 bg-laiton-400/[0.1] text-laiton-300"
                    : "border-graphite-800 bg-graphite-900/60 text-graphite-300 hover:border-graphite-600 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Ce que tu as mangé (optionnel)">
          <Input
            type="text"
            placeholder="ex: poulet, riz et brocolis"
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            maxLength={120}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Field label="Calories">
            <Input type="number" min="0" inputMode="numeric" placeholder="kcal" value={calories} onChange={(e) => setCalories(e.target.value)} />
          </Field>
          <Field label="Protéines">
            <Input type="number" min="0" inputMode="numeric" placeholder="g" value={proteines} onChange={(e) => setProteines(e.target.value)} />
          </Field>
          <Field label="Glucides">
            <Input type="number" min="0" inputMode="numeric" placeholder="g" value={glucides} onChange={(e) => setGlucides(e.target.value)} />
          </Field>
          <Field label="Lipides">
            <Input type="number" min="0" inputMode="numeric" placeholder="g" value={lipides} onChange={(e) => setLipides(e.target.value)} />
          </Field>
        </div>
        <Field label="Note (optionnel)">
          <Textarea
            placeholder="ex: repas de famille le midi, sinon suivi le plan"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Ajout…" : "Ajouter mon bilan"}
        </Button>
      </form>
    </Card>
  );
}
