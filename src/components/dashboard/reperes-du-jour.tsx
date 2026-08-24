"use client";

import { useEffect, useRef, useState } from "react";

type ActiviteResume = {
  entreeAujourdhui: { pas: number | null } | null;
  signaux: { moyenne7j: number | null };
};

const CLE_EAU = "coai_eau_aujourdhui_";

function cleEau() {
  return `${CLE_EAU}${new Date().toISOString().slice(0, 10)}`;
}

export function ReperesDuJour({ habitudeHydratation }: { habitudeHydratation?: string | null }) {
  const [verres, setVerres] = useState(0);
  const [pas, setPas] = useState<number | null>(null);
  const [moyennePas, setMoyennePas] = useState<number | null>(null);
  const [saisiePas, setSaisiePas] = useState("");
  const [secondes, setSecondes] = useState(60);
  const [respirationActive, setRespirationActive] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const intervalle = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setVerres(Number(localStorage.getItem(cleEau()) ?? 0));
    fetch("/api/activite-journaliere")
      .then((reponse) => reponse.json())
      .then((donnees: ActiviteResume) => {
        setPas(donnees.entreeAujourdhui?.pas ?? null);
        setMoyennePas(donnees.signaux?.moyenne7j ?? null);
      })
      .catch(() => undefined);
    return () => {
      if (intervalle.current) clearInterval(intervalle.current);
    };
  }, []);

  function ajouterUnVerre() {
    const suivant = verres + 1;
    setVerres(suivant);
    localStorage.setItem(cleEau(), String(suivant));
  }

  function lancerRespiration() {
    if (respirationActive) return;
    setSecondes(60);
    setRespirationActive(true);
    intervalle.current = setInterval(() => {
      setSecondes((valeur) => {
        if (valeur <= 1) {
          if (intervalle.current) clearInterval(intervalle.current);
          intervalle.current = null;
          setRespirationActive(false);
          return 0;
        }
        return valeur - 1;
      });
    }, 1000);
  }

  async function enregistrerPas() {
    const valeur = Number(saisiePas);
    if (!Number.isFinite(valeur) || valeur < 0) return;
    setEnregistrement(true);
    try {
      const reponse = await fetch("/api/activite-journaliere", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pas: Math.round(valeur), source: "SAISIE_MANUELLE" }),
      });
      if (reponse.ok) {
        const donnees = (await reponse.json()) as ActiviteResume;
        setPas(donnees.entreeAujourdhui?.pas ?? Math.round(valeur));
        setMoyennePas(donnees.signaux?.moyenne7j ?? null);
        setSaisiePas("");
      }
    } finally {
      setEnregistrement(false);
    }
  }

  const phaseRespiration = secondes % 10 >= 6 ? "Expire doucement" : "Inspire doucement";

  return (
    <section className="coai-glass overflow-hidden p-5 sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">Équilibre quotidien</p>
          <h2 className="mt-1.5 font-editorial text-2xl text-white">Tes trois repères du jour.</h2>
        </div>
        <p className="hidden max-w-xs text-right text-xs leading-5 text-graphite-400 sm:block">Des gestes simples, suivis sans intelligence artificielle.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <article className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.045] p-4">
          <div aria-hidden="true" className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cyan-300/15 blur-2xl" />
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-200">Hydratation</p>
          <div className="mt-3 flex items-end gap-2"><strong className="text-3xl tabular-nums text-white">{verres}</strong><span className="pb-1 text-xs text-graphite-400">verre{verres > 1 ? "s" : ""} aujourd’hui</span></div>
          <p className="mt-2 min-h-8 text-[11px] leading-4 text-graphite-400">{habitudeHydratation ? `Habitude déclarée : ${habitudeHydratation}.` : "Écoute ta soif et adapte-toi à ton effort."}</p>
          <button type="button" onClick={ajouterUnVerre} className="mt-3 w-full rounded-full border border-cyan-300/30 bg-cyan-300/10 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/20">+ Ajouter un verre</button>
        </article>

        <article className="relative overflow-hidden rounded-2xl border border-violet-300/20 bg-violet-300/[0.045] p-4">
          <div aria-hidden="true" className={`absolute right-4 top-4 h-12 w-12 rounded-full border border-violet-300/30 bg-violet-300/10 ${respirationActive ? "animate-pulse" : ""}`} />
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-violet-200">Respiration</p>
          <div className="mt-3 flex items-end gap-2"><strong className="text-3xl tabular-nums text-white">{secondes === 0 ? "✓" : respirationActive ? secondes : "1"}</strong><span className="pb-1 text-xs text-graphite-400">{respirationActive ? "secondes" : secondes === 0 ? "terminée" : "minute"}</span></div>
          <p className="mt-2 min-h-8 text-[11px] leading-4 text-graphite-400">{respirationActive ? phaseRespiration : secondes === 0 ? "Une minute pour revenir au calme." : "Inspire 4 secondes, expire 6 secondes."}</p>
          <button type="button" onClick={lancerRespiration} disabled={respirationActive} className="mt-3 w-full rounded-full border border-violet-300/30 bg-violet-300/10 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-300/20 disabled:opacity-60">{respirationActive ? "Respire…" : secondes === 0 ? "Recommencer" : "Commencer"}</button>
        </article>

        <article className="relative overflow-hidden rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.05] p-4">
          <div aria-hidden="true" className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-laiton-400/15 blur-2xl" />
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-200">Nombre de pas</p>
          <div className="mt-3 flex items-end gap-2"><strong className="text-3xl tabular-nums text-white">{pas?.toLocaleString("fr-FR") ?? "—"}</strong><span className="pb-1 text-xs text-graphite-400">aujourd’hui</span></div>
          <p className="mt-2 min-h-8 text-[11px] leading-4 text-graphite-400">{moyennePas ? `Ta référence personnelle : ${moyennePas.toLocaleString("fr-FR")} pas sur 7 jours.` : "Construis ta propre référence, sans objectif arbitraire."}</p>
          <div className="mt-3 flex gap-2">
            <input aria-label="Nombre de pas aujourd'hui" type="number" min={0} max={100000} value={saisiePas} onChange={(e) => setSaisiePas(e.target.value)} placeholder="6 500" className="min-w-0 flex-1 rounded-full border border-laiton-400/25 bg-black/20 px-3 py-2 text-xs text-white outline-none placeholder:text-graphite-600 focus:border-laiton-300" />
            <button type="button" onClick={enregistrerPas} disabled={enregistrement || !saisiePas} className="rounded-full bg-laiton-400 px-3 py-2 text-xs font-bold text-graphite-950 disabled:opacity-40">Valider</button>
          </div>
        </article>
      </div>
    </section>
  );
}
