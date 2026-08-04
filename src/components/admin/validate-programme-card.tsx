"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SectionLabel } from "@/components/ui/section-label";
import { JsonView } from "@/components/programme/json-view";

const PILIER_LABELS: Record<string, string> = {
  ENTRAINEMENT: "Entraînement",
  NUTRITION: "Nutrition",
  RECUPERATION: "Récupération",
};

export function ValidateProgrammeCard({
  id,
  pilier,
  userEmail,
  contenu,
  generatedAt,
}: {
  id: string;
  pilier: string;
  userEmail: string;
  contenu: unknown;
  generatedAt: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => JSON.stringify(contenu, null, 2));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function valider(contenuOverride?: unknown) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/programmes/${id}/valider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contenuOverride !== undefined ? { contenu: contenuOverride } : {}),
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
      const res = await fetch(`/api/admin/programmes/${id}/rejeter`, { method: "POST" });
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

      {editing ? (
        <Textarea
          rows={16}
          className="font-mono text-xs"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <div className="max-h-96 overflow-y-auto rounded-md border border-graphite-800 p-3">
          <JsonView data={contenu} />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-2">
        {editing ? (
          <Button onClick={validerAvecModifications} disabled={loading}>
            {loading ? "Validation…" : "Valider avec ces modifications"}
          </Button>
        ) : (
          <Button onClick={() => valider()} disabled={loading}>
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
