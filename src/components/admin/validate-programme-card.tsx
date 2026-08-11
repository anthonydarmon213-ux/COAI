"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SectionLabel } from "@/components/ui/section-label";
import { Badge } from "@/components/ui/badge";
import { EntrainementView } from "@/components/programme/entrainement-view";
import { NutritionView } from "@/components/programme/nutrition-view";
import { RecuperationView } from "@/components/programme/recuperation-view";

type SuggestionCoai = {
  resume: string;
  changements: { cible: string; avant: string | number | null; apres: string | number | null; raison: string }[];
};

const PILIER_LABELS: Record<string, string> = {
  ENTRAINEMENT: "Entraînement",
  NUTRITION: "Nutrition",
  RECUPERATION: "Récupération",
};

function PilierView({ pilier, contenu }: { pilier: string; contenu: unknown }) {
  if (pilier === "ENTRAINEMENT") return <EntrainementView data={contenu} showContreIndications />;
  if (pilier === "NUTRITION") return <NutritionView data={contenu} showContreIndications />;
  if (pilier === "RECUPERATION") return <RecuperationView data={contenu} showContreIndications />;
  return null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Checklist obligatoire avant validation — remplace la relecture "à
// l'œil" par une vérification bornée dans le temps (quelques points fixes
// + les contre-indications déjà générées par l'IA pour ce profil), pour
// que la validation humaine reste scalable en ajoutant des coachs plutôt
// qu'en dépendant du temps libre d'un seul.
const CHECKS_GENERIQUES = [
  "Le volume et la difficulté sont cohérents avec le niveau et les objectifs déclarés.",
  "Le contenu est adapté à l'équipement disponible et aux contraintes déclarées.",
];

function checklistItems(contenu: unknown): string[] {
  const contreIndications =
    isPlainObject(contenu) && Array.isArray(contenu.contreIndications)
      ? contenu.contreIndications.map((item) => String(item))
      : [];
  return [...contreIndications, ...CHECKS_GENERIQUES];
}

export function ValidateProgrammeCard({
  id,
  pilier,
  userEmail,
  contenu,
  generatedAt,
  suggestionCoai,
}: {
  id: string;
  pilier: string;
  userEmail: string;
  contenu: unknown;
  generatedAt: string;
  suggestionCoai?: SuggestionCoai | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => JSON.stringify(contenu, null, 2));
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const items = checklistItems(contenu);
  const [checked, setChecked] = useState<boolean[]>(() => items.map(() => false));
  const checklistComplete = checked.length > 0 && checked.every(Boolean);

  function toggleCheck(i: number) {
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  async function valider(contenuOverride?: unknown) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/programmes/${id}/valider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(contenuOverride !== undefined ? { contenu: contenuOverride } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : "Échec de la validation.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  async function rejeter() {
    if (!window.confirm("Rejeter cette génération ? Elle sera supprimée définitivement.")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/programmes/${id}/rejeter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note.trim() ? { note: note.trim() } : {}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : "Échec du rejet.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  function validerAvecModifications() {
    try {
      const parsed = JSON.parse(draft);
      valider(parsed);
    } catch {
      setError("JSON invalide — vérifie la syntaxe avant de valider.");
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <SectionLabel>{PILIER_LABELS[pilier] ?? pilier}</SectionLabel>
          <p className="text-xs text-graphite-400">
            {userEmail} — {new Date(generatedAt).toLocaleString("fr-FR")}
          </p>
        </div>
        <Button variant="ghost" onClick={() => setEditing((v) => !v)}>
          {editing ? "Annuler la modification" : "Modifier avant validation"}
        </Button>
      </div>

      {suggestionCoai && (
        <div className="flex flex-col gap-2 rounded-md border border-laiton-400/20 bg-laiton-400/[0.04] p-3">
          <Badge tone="success">Suggestion COAI</Badge>
          <p className="text-sm leading-6 text-graphite-200">{suggestionCoai.resume}</p>
          {suggestionCoai.changements.length > 0 && (
            <ul className="flex flex-col gap-1 text-xs text-graphite-400">
              {suggestionCoai.changements.map((c, i) => (
                <li key={i}>
                  <span className="text-graphite-200">{c.cible}</span>
                  {c.avant != null && c.apres != null ? ` : ${c.avant} → ${c.apres}` : ""}
                  {" — "}
                  {c.raison}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {editing ? (
        <Textarea
          rows={16}
          className="font-mono text-xs"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <div className="max-h-[32rem] overflow-y-auto rounded-md border border-graphite-800 p-3">
          <PilierView pilier={pilier} contenu={contenu} />
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-md border border-graphite-800 bg-graphite-900/40 p-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-laiton-500">
          Checklist avant validation
        </span>
        {items.map((item, i) => (
          <label key={i} className="flex items-start gap-2 text-sm text-graphite-300">
            <input
              type="checkbox"
              checked={checked[i] ?? false}
              onChange={() => toggleCheck(i)}
              className="mt-0.5"
            />
            {item}
          </label>
        ))}
      </div>

      <Textarea
        rows={2}
        placeholder="Note pour l'abonné (facultatif) — visible dans son historique"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        {editing ? (
          <Button onClick={validerAvecModifications} disabled={loading || !checklistComplete}>
            {loading ? "Validation…" : "Valider avec ces modifications"}
          </Button>
        ) : (
          <Button onClick={() => valider()} disabled={loading || !checklistComplete}>
            {loading ? "Validation…" : "Valider tel quel"}
          </Button>
        )}
        <Button
          variant="ghost"
          className="text-red-400 hover:text-red-300"
          onClick={rejeter}
          disabled={loading}
        >
          Rejeter
        </Button>
      </div>
    </Card>
  );
}
