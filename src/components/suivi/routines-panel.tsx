"use client";

import { useEffect, useState } from "react";
import { Layers, Plus, Trash2, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";

// Routines (01/09/2026, demande Anthony) : sans modèle réutilisable, il faut
// ressaisir tous ses exercices à chaque séance — c'est ce qui condamne un
// carnet à l'abandon au bout de quelques jours.
//
// Le panneau vit au-dessus du formulaire et le préremplit : « Utiliser »
// remonte les exercices choisis vers SeanceForm plutôt que de dupliquer un
// second formulaire de saisie.

export type ExerciceRoutine = { nom: string; series?: number };
export type Routine = { id: string; nom: string; exercices: ExerciceRoutine[] };

export function RoutinesPanel({
  onUtiliser,
}: {
  onUtiliser: (exercices: ExerciceRoutine[], nomRoutine: string) => void;
}) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [chargement, setChargement] = useState(true);
  const [creation, setCreation] = useState(false);
  const [nom, setNom] = useState("");
  const [lignes, setLignes] = useState<ExerciceRoutine[]>([{ nom: "", series: 3 }]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    fetch("/api/routines")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setRoutines(Array.isArray(d) ? d : []))
      .catch(() => setRoutines([]))
      .finally(() => setChargement(false));
  }, []);

  async function creer() {
    const propres = lignes.filter((l) => l.nom.trim().length > 0);
    if (!nom.trim() || propres.length === 0) {
      setErreur("Donne un nom à ta routine et au moins un exercice.");
      return;
    }
    setEnvoi(true);
    setErreur(null);
    try {
      const r = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: nom.trim(), exercices: propres }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        setErreur(typeof d?.error === "string" ? d.error : "Création impossible.");
        return;
      }
      const creee = (await r.json()) as Routine;
      setRoutines((prev) => [...prev, creee].sort((a, b) => a.nom.localeCompare(b.nom)));
      setNom("");
      setLignes([{ nom: "", series: 3 }]);
      setCreation(false);
    } catch {
      setErreur("Création impossible, réessaie.");
    } finally {
      setEnvoi(false);
    }
  }

  async function supprimer(id: string) {
    if (!window.confirm("Supprimer cette routine ? Tes séances déjà enregistrées ne changent pas.")) return;
    const avant = routines;
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    const r = await fetch(`/api/routines/${id}`, { method: "DELETE" }).catch(() => null);
    if (!r || !r.ok) setRoutines(avant); // restaure si l'appel a échoué
  }

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-laiton-300" aria-hidden="true" />
          <SectionLabel>Mes routines</SectionLabel>
        </div>
        <button
          type="button"
          onClick={() => setCreation((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-graphite-200 transition hover:border-laiton-300/40 hover:text-white"
        >
          <Plus size={13} aria-hidden="true" />
          {creation ? "Annuler" : "Nouvelle routine"}
        </button>
      </div>

      {!chargement && routines.length === 0 && !creation && (
        <p className="text-xs leading-5 text-graphite-400">
          Enregistre tes séances types — Full body, Push, Pull, Jambes — et remplis
          ton carnet en un clic au lieu de tout ressaisir.
        </p>
      )}

      {routines.length > 0 && (
        <div className="flex flex-col gap-2">
          {routines.map((r) => (
            <div key={r.id} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#fffdf8]">{r.nom}</p>
                <p className="truncate text-[11px] text-graphite-400">
                  {r.exercices.length} exercice{r.exercices.length > 1 ? "s" : ""} ·{" "}
                  {r.exercices.map((e) => e.nom).join(", ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onUtiliser(r.exercices, r.nom)}
                className="inline-flex flex-none items-center gap-1.5 rounded-full bg-laiton-300 px-3 py-1.5 text-xs font-bold text-[#101214] transition hover:bg-laiton-200"
              >
                <Zap size={12} aria-hidden="true" />
                Utiliser
              </button>
              <button
                type="button"
                onClick={() => supprimer(r.id)}
                aria-label={`Supprimer la routine ${r.nom}`}
                className="flex-none rounded-full p-1.5 text-graphite-500 transition hover:text-red-400"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {creation && (
        <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <Input
            type="text"
            placeholder="Nom de la routine — ex : Full body, Push, Jambes"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            maxLength={60}
          />
          {lignes.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                type="text"
                list="coai-exercices"
                autoComplete="off"
                placeholder="Exercice"
                value={l.nom}
                onChange={(e) =>
                  setLignes((prev) => prev.map((x, j) => (j === i ? { ...x, nom: e.target.value } : x)))
                }
              />
              <Input
                type="number"
                min="1"
                max="20"
                className="w-20 flex-none"
                placeholder="Séries"
                value={l.series ?? ""}
                onChange={(e) =>
                  setLignes((prev) =>
                    prev.map((x, j) => (j === i ? { ...x, series: Number(e.target.value) || undefined } : x))
                  )
                }
              />
              {lignes.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLignes((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="Retirer cet exercice"
                  className="flex-none text-graphite-500 hover:text-red-400"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLignes((prev) => [...prev, { nom: "", series: 3 }])}
            className="self-start rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-graphite-300 hover:text-white"
          >
            + Exercice
          </button>
          {erreur && <p className="text-xs text-red-400">{erreur}</p>}
          <Button type="button" onClick={creer} disabled={envoi}>
            {envoi ? "Enregistrement…" : "Enregistrer la routine"}
          </Button>
        </div>
      )}

      {/* Pas de <datalist> ici : SeanceForm en rend déjà une avec le même
          id, et deux listes homonymes casseraient l'autocomplétion. */}
    </Card>
  );
}
