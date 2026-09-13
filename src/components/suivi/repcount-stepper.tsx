"use client";

import { useEffect, useId, useRef, useState } from "react";

export function lireValeur(raw: string, minimum: number, maximum: number, entier: boolean): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  return value >= minimum && value <= maximum && (!entier || Number.isInteger(value)) ? value : null;
}

// Stable component identity: the rest countdown must not remount the input.
export function RepCountStepper({ label, valeur, setValeur, pas, unite, minimum = 0,
  maximum = 10000, entier = false }: {
  label: string; valeur: number; setValeur: (v: number) => void;
  pas: number; unite: string; minimum?: number; maximum?: number; entier?: boolean;
}) {
  const id = useId();
  const [saisie, setSaisie] = useState(String(valeur));
  const editing = useRef(false);
  useEffect(() => { if (!editing.current) setSaisie(String(valeur)); }, [valeur]);
  const valid = lireValeur(saisie, minimum, maximum, entier) !== null;
  const ajuster = (delta: number) => {
    const next = Math.min(maximum, Math.max(minimum, Math.round((valeur + delta) * 100) / 100));
    setSaisie(String(next)); setValeur(next);
  };
  return <div className="min-w-0 flex-1">
    <label htmlFor={id} className="block text-center font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-400">{label}</label>
    <div className="mt-1.5 flex items-center gap-2">
      <button type="button" disabled={valeur <= minimum} onClick={() => ajuster(-pas)} aria-label={`Diminuer ${label}`}
        className="h-12 w-12 shrink-0 rounded-xl border border-white/12 bg-white/[0.04] text-xl font-bold text-white active:bg-white/10 disabled:opacity-30">−</button>
      <div className="flex min-w-0 flex-1 items-center rounded-xl border border-white/15 bg-black/20 px-2 focus-within:border-cyan-300">
        <input id={id} type="text" inputMode={entier ? "numeric" : "decimal"} value={saisie} maxLength={10}
          aria-invalid={!valid} aria-describedby={!valid ? `${id}-error` : undefined}
          className="h-12 w-full min-w-0 bg-transparent text-center font-display text-3xl font-semibold tabular-nums text-white outline-none"
          onFocus={event => { editing.current = true; event.currentTarget.select(); }}
          onChange={event => {
            setSaisie(event.target.value);
            const next = lireValeur(event.target.value, minimum, maximum, entier);
            if (next !== null) setValeur(next);
          }}
          onBlur={() => { editing.current = false; setSaisie(String(valeur)); }}
          onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }} />
        {unite && <span className="text-sm text-graphite-400">{unite}</span>}
      </div>
      <button type="button" disabled={valeur >= maximum} onClick={() => ajuster(pas)} aria-label={`Augmenter ${label}`}
        className="h-12 w-12 shrink-0 rounded-xl border border-white/12 bg-white/[0.04] text-xl font-bold text-white active:bg-white/10 disabled:opacity-30">+</button>
    </div>
    {!valid && <p id={`${id}-error`} className="mt-1 text-xs text-amber-200">Saisis {entier ? "un entier" : "un nombre"} entre {minimum} et {maximum}. Sinon, la dernière valeur valide sera conservée.</p>}
  </div>;
}
