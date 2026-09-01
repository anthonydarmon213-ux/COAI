"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";

type VueProgramme = "aujourdhui" | "semaine" | "complet";

const ONGLETS: Array<{ id: VueProgramme; label: string }> = [
  { id: "aujourdhui", label: "Aujourd'hui" },
  { id: "semaine", label: "Cette semaine" },
  { id: "complet", label: "Plan complet" },
];

export function LectureProgrammeTabs({
  aujourdHui,
  semaine,
  planComplet,
}: {
  aujourdHui: ReactNode;
  semaine: ReactNode;
  planComplet: ReactNode;
}) {
  const [vue, setVue] = useState<VueProgramme>("aujourdhui");
  const contenu = vue === "aujourdhui" ? aujourdHui : vue === "semaine" ? semaine : planComplet;

  function naviguerAuClavier(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const dernierePosition = ONGLETS.length - 1;
    let prochainePosition: number | null = null;

    if (event.key === "ArrowRight") prochainePosition = index === dernierePosition ? 0 : index + 1;
    if (event.key === "ArrowLeft") prochainePosition = index === 0 ? dernierePosition : index - 1;
    if (event.key === "Home") prochainePosition = 0;
    if (event.key === "End") prochainePosition = dernierePosition;
    if (prochainePosition === null) return;

    event.preventDefault();
    const prochainOnglet = ONGLETS[prochainePosition];
    if (!prochainOnglet) return;
    setVue(prochainOnglet.id);
    document.getElementById(`lecture-programme-tab-${prochainOnglet.id}`)?.focus();
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Choisir le niveau de détail du programme"
        className="grid grid-cols-3 gap-1 rounded-2xl border border-white/[0.08] bg-black/25 p-1"
      >
        {ONGLETS.map((onglet, index) => {
          const actif = vue === onglet.id;
          return (
            <button
              key={onglet.id}
              id={`lecture-programme-tab-${onglet.id}`}
              type="button"
              role="tab"
              aria-selected={actif}
              aria-controls={actif ? `lecture-programme-panel-${onglet.id}` : undefined}
              tabIndex={actif ? 0 : -1}
              onClick={() => setVue(onglet.id)}
              onKeyDown={(event) => naviguerAuClavier(event, index)}
              className={`min-h-11 rounded-xl px-2 py-2 text-[11px] font-semibold transition sm:text-sm ${
                actif
                  ? "bg-laiton-400 text-graphite-950 shadow-[0_8px_24px_-14px_rgba(201,162,98,0.9)]"
                  : "text-graphite-400 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              {onglet.label}
            </button>
          );
        })}
      </div>

      <div
        id={`lecture-programme-panel-${vue}`}
        role="tabpanel"
        aria-labelledby={`lecture-programme-tab-${vue}`}
        className="min-w-0"
      >
        {contenu}
      </div>

      {vue !== "complet" && (
        <button
          type="button"
          onClick={() => setVue(vue === "aujourdhui" ? "semaine" : "complet")}
          className="self-start text-sm font-semibold text-laiton-300 transition hover:text-laiton-200"
        >
          {vue === "aujourdhui" ? "Voir toute ma semaine →" : "Ouvrir le plan détaillé →"}
        </button>
      )}
    </div>
  );
}
