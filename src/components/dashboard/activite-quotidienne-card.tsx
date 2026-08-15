"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InfoTooltip } from "@/components/ui/tooltip";

const STORAGE_SKIP_KEY_PREFIX = "coai_neat_passe_";

type Source = "SAISIE_MANUELLE" | "MONTRE" | "APPLICATION_SANTE";
type TypeJournee = "TRAVAIL" | "REPOS" | "VOYAGE" | "WEEKEND";
type TypeTravail = "ASSIS" | "MIXTE" | "DEBOUT" | "PHYSIQUE";

type Resume = {
  entreeAujourdhui: { pas: number | null; source: Source } | null;
  signaux: {
    joursRenseignes: number;
    moyenne7j: number | null;
    moyenne28j: number | null;
  };
  recommandation: { type: string; message: string; ton: "neutral" | "success" | "warning" };
  enVoyage: boolean;
};

const SOURCE_OPTIONS: { value: Source; label: string }[] = [
  { value: "SAISIE_MANUELLE", label: "Saisie manuelle" },
  { value: "MONTRE", label: "Montre" },
  { value: "APPLICATION_SANTE", label: "App santé" },
];

const JOURNEE_OPTIONS: { value: TypeJournee; label: string }[] = [
  { value: "TRAVAIL", label: "Travail" },
  { value: "REPOS", label: "Repos" },
  { value: "VOYAGE", label: "Voyage" },
  { value: "WEEKEND", label: "Week-end" },
];

const TRAVAIL_OPTIONS: { value: TypeTravail; label: string }[] = [
  { value: "ASSIS", label: "Assis" },
  { value: "MIXTE", label: "Mixte" },
  { value: "DEBOUT", label: "Debout" },
  { value: "PHYSIQUE", label: "Physique" },
];

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full border px-3 py-1.5 text-xs transition ${
            value === o.value
              ? "border-laiton-400/50 bg-laiton-400/15 text-laiton-200"
              : "border-graphite-800 text-graphite-400 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const TON_BADGE: Record<Resume["recommandation"]["ton"], "neutral" | "success" | "warning"> = {
  neutral: "neutral",
  success: "success",
  warning: "warning",
};

// Carte "Activité quotidienne" (Phase 3, bloc NEAT, 11/08/2026) — propose
// une saisie rapide et facultative du jour, puis affiche la référence
// personnelle (moyenne 7j/28j) et une recommandation déterministe. Jamais
// d'objectif universel de pas affiché ici — cf. src/lib/neat/recommandation.ts.
export function ActiviteQuotidienneCard() {
  const [loaded, setLoaded] = useState(false);
  const [resume, setResume] = useState<Resume | null>(null);
  const [passe, setPasse] = useState(false);

  const [pas, setPas] = useState("");
  const [source, setSource] = useState<Source>("SAISIE_MANUELLE");
  const [typeJournee, setTypeJournee] = useState<TypeJournee | null>(null);
  const [typeTravail, setTypeTravail] = useState<TypeTravail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cle = STORAGE_SKIP_KEY_PREFIX + new Date().toISOString().slice(0, 10);
    setPasse(Boolean(sessionStorage.getItem(cle)));
    fetch("/api/activite-journaliere")
      .then((res) => res.json())
      .then((data) => setResume(data))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || !resume) return null;

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/activite-journaliere", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pas: pas ? Number(pas) : undefined,
          source,
          typeJournee: typeJournee ?? undefined,
          typeTravail: typeTravail ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Échec de l'enregistrement.");
      setResume(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  function passerAujourdhui() {
    const cle = STORAGE_SKIP_KEY_PREFIX + new Date().toISOString().slice(0, 10);
    sessionStorage.setItem(cle, "1");
    setPasse(true);
  }

  const doitSaisir = !resume.entreeAujourdhui && !passe;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-white">Activité quotidienne</h2>
        <InfoTooltip text="Le NEAT correspond à toute l'activité réalisée en dehors de tes séances : marche, déplacements, escaliers, tâches quotidiennes et temps passé debout." />
      </div>

      {doitSaisir ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-graphite-400">Combien de pas aujourd&apos;hui ? (facultatif)</p>
          <input
            type="number"
            min={0}
            max={100000}
            placeholder="ex: 6500"
            value={pas}
            onChange={(e) => setPas(e.target.value)}
            className="rounded-lg border border-graphite-800 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-laiton-400/40"
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-graphite-400">Source</span>
            <Chips options={SOURCE_OPTIONS} value={source} onChange={setSource} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-graphite-400">Type de journée (facultatif)</span>
            <Chips options={JOURNEE_OPTIONS} value={typeJournee} onChange={setTypeJournee} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-graphite-400">Type de travail (facultatif)</span>
            <Chips options={TRAVAIL_OPTIONS} value={typeTravail} onChange={setTypeTravail} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading} className="px-5 py-2 text-xs">
              {loading ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <button
              type="button"
              onClick={passerAujourdhui}
              className="rounded-full border border-graphite-800 px-4 py-2 text-xs text-graphite-400 transition hover:text-white"
            >
              Passer aujourd&apos;hui
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge tone={TON_BADGE[resume.recommandation.ton]}>
              {resume.signaux.joursRenseignes} jour{resume.signaux.joursRenseignes > 1 ? "s" : ""} renseigné
              {resume.signaux.joursRenseignes > 1 ? "s" : ""}
            </Badge>
            {resume.signaux.moyenne7j != null && (
              <span className="text-xs text-graphite-500">~{resume.signaux.moyenne7j} pas/jour (7j)</span>
            )}
          </div>
          <p className="text-sm leading-6 text-graphite-200">{resume.recommandation.message}</p>
          <Link
              href="/videos/neat"
            className="mt-1 inline-flex w-fit items-center gap-1.5 text-xs text-laiton-300 hover:underline"
          >
              Lire le guide NEAT →
          </Link>
        </div>
      )}
    </Card>
  );
}
