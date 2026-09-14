"use client";

import { useState } from "react";

const PRESETS = [30, 60, 75, 90, 120, 180];
export function RestDuration({ value, onChange }: { value: number; onChange: (seconds: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [error, setError] = useState(false);
  const label = (n: number) => `${Math.floor(n / 60)} min${n % 60 ? ` ${n % 60} s` : ""}`;
  function edit() {
    setMinutes(String(Math.floor(value / 60))); setSeconds(String(value % 60));
    setError(false); setEditing(true);
  }
  function apply() {
    const m = Number(minutes), s = Number(seconds), total = m * 60 + s;
    if (!/^\d+$/.test(minutes) || !/^\d+$/.test(seconds) || !Number.isSafeInteger(total)
      || s > 59 || total < 1 || total > 3600) { setError(true); return; }
    onChange(total); setEditing(false); setError(false);
  }
  return <div className="space-y-3">
    <label className="block text-sm text-graphite-300">Repos entre les séries
      <select value={value} onChange={e => {
        if (e.target.value === "custom") edit();
        else { onChange(Number(e.target.value)); setEditing(false); }
      }} className="mt-2 min-h-11 w-full rounded-xl border border-white/15 bg-slate-950 px-3 text-base text-white">
        {PRESETS.map(n => <option key={n} value={n}>{label(n)}</option>)}
        {!PRESETS.includes(value) && <option value={value}>{label(value)} · personnalisé</option>}
        <option value="custom">Autre durée…</option>
      </select>
    </label>
    {editing && <fieldset className="space-y-3 rounded-xl border border-white/15 p-4">
      <legend className="px-1 text-sm text-white">Durée personnalisée</legend>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm text-graphite-200">Minutes<input type="text" inputMode="numeric" value={minutes} onChange={e => setMinutes(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg bg-slate-950 px-3 text-base text-white" /></label>
        <label className="text-sm text-graphite-200">Secondes<input type="text" inputMode="numeric" value={seconds} onChange={e => setSeconds(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg bg-slate-950 px-3 text-base text-white" /></label>
      </div>
      {error && <p role="alert" className="text-sm text-red-300">Choisis entre 1 seconde et 60 minutes, avec 0 à 59 secondes dans le second champ.</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={apply} className="min-h-11 rounded-full bg-cyan-300 px-5 text-sm font-semibold text-slate-950">Appliquer</button>
        <button type="button" onClick={() => setEditing(false)} className="min-h-11 px-3 text-sm text-white underline">Annuler</button>
      </div>
    </fieldset>}
    <p className="text-xs text-graphite-400">La durée choisie s’applique au prochain repos. Le décompte en cours ne change pas.</p>
  </div>;
}
