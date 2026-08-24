"use client";

import { useState } from "react";

// Check-in léger pour un jour de repos (19/08/2026, retour Anthony : le
// Score COAI comportemental — cf. src/lib/insight/age-coai.ts — restait
// pénalisé les jours sans séance, faute de pouvoir faire un check-in ce
// jour-là). Même sommeil/énergie/douleur que DailyExperience, mais sans
// food ni availableMinutes (rien à dimensionner, aucune séance ce jour) —
// /api/daily accepte déjà ces deux champs comme facultatifs pour ce cas.

const SLEEP = [
  ["TRES_MAUVAIS", "Très mauvais"], ["MAUVAIS", "Mauvais"], ["CORRECT", "Correct"],
  ["BON", "Bon"], ["EXCELLENT", "Excellent"],
] as const;
const ENERGY = [
  ["TRES_BASSE", "Très basse"], ["BASSE", "Basse"], ["NORMALE", "Normale"],
  ["HAUTE", "Haute"], ["TRES_HAUTE", "Très haute"],
] as const;
const AREAS = ["Dos", "Épaule", "Genou", "Cheville", "Poignet", "Hanche", "Cou", "Autre"];

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`coai-daily-chip min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-[#b98b43] bg-[#27241f] shadow-sm"
          : "border-white/10 bg-white/[0.04] text-graphite-200 hover:border-laiton-400/40 hover:bg-white/[0.08]"
      }`}
    >
      {children}
    </button>
  );
}

type InitialDaily = { sleep: string | null; energy: string | null; pain: boolean | null; painArea: string | null } | null;

export function RestDayCheckin({ initialDaily }: { initialDaily: InitialDaily }) {
  const [sleep, setSleep] = useState(initialDaily?.sleep ?? "");
  const [energy, setEnergy] = useState(initialDaily?.energy ?? "");
  const [pain, setPain] = useState(initialDaily?.pain ?? false);
  const [painArea, setPainArea] = useState(initialDaily?.painArea ?? "");
  const [done, setDone] = useState(Boolean(initialDaily?.sleep));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!sleep || !energy) return setError("Réponds aux deux repères pour que COAI garde ta régularité à jour.");
    if (pain && !painArea) return setError("Indique simplement la zone gênée.");
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin", sleep, energy, pain, painArea: pain ? painArea : undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(typeof data?.error === "string" ? data.error : "Une erreur est survenue.");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-200">
        Bilan du jour enregistré — cela compte aussi pour ta régularité, même sans séance.
      </p>
    );
  }

  return (
    <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-black/15 p-4 sm:p-5">
      <p className="text-sm font-bold text-white">Même un jour de repos, dis à COAI comment tu vas.</p>
      <div>
        <p className="mb-2 text-xs font-semibold text-graphite-300">Comment as-tu dormi ?</p>
        <div className="flex flex-wrap gap-2">
          {SLEEP.map(([value, label]) => (
            <Chip key={value} active={sleep === value} onClick={() => setSleep(value)}>{label}</Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-graphite-300">Comment est ta forme ?</p>
        <div className="flex flex-wrap gap-2">
          {ENERGY.map(([value, label]) => (
            <Chip key={value} active={energy === value} onClick={() => setEnergy(value)}>{label}</Chip>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold text-graphite-300">Une douleur ou une gêne ?</p>
        <div className="flex gap-2">
          <Chip active={!pain} onClick={() => { setPain(false); setPainArea(""); }}>Non, tout va bien</Chip>
          <Chip active={pain} onClick={() => setPain(true)}>Oui</Chip>
        </div>
        {pain && (
          <div className="mt-3 flex flex-wrap gap-2">
            {AREAS.map((area) => (
              <Chip key={area} active={painArea === area} onClick={() => setPainArea(area)}>{area}</Chip>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-1 inline-flex items-center justify-center rounded-full bg-laiton-400 px-6 py-3 text-sm font-bold text-graphite-950 transition hover:bg-laiton-300 disabled:opacity-60"
      >
        {loading ? "Enregistrement…" : "Valider mon bilan"}
      </button>
    </div>
  );
}
