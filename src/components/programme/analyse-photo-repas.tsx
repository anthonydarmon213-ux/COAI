"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { compressProgressPhoto } from "@/lib/images/compress-progress-photo";

type Resultat = {
  analysable: boolean;
  nomPlat: string | null;
  aliments: string[];
  caloriesEstimees: number | null;
  proteinesG: number | null;
  glucidesG: number | null;
  lipidesG: number | null;
  resume: string | null;
  conseilCoach?: string | null;
};

// Outil ponctuel (20/08/2026, demande Anthony) : prendre en photo son plat et
// obtenir une estimation macros/calories. Distinct du RepasLog existant
// (check-in repas prévu/écart) et du plan nutrition généré par l'IA — rien
// n'est enregistré ici, c'est une estimation à la demande, jamais une donnée
// de suivi durable (V1 volontairement simple).
export function AnalysePhotoRepas() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  // Enregistrement au journal (01/09/2026, demande Anthony) : jusqu'ici
  // l'estimation était affichée puis perdue. L'utilisateur photographiait,
  // obtenait des chiffres, et rien n'était compté.
  const [enregistrement, setEnregistrement] = useState<"idle" | "envoi" | "ok" | "erreur">("idle");
  const router = useRouter();

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setResultat(null);
    setEnregistrement("idle");
    try {
      const optimized = await compressProgressPhoto(file);
      const formData = new FormData();
      formData.append("file", optimized.file);
      const res = await fetch("/api/nutrition/photo-repas", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'analyse de la photo.");
      setResultat(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">
        📷 Analyse ton plat
      </p>
      <p className="text-sm leading-6 text-graphite-300">
        Prends ton assiette en photo, COAI estime les calories et macros. Une estimation visuelle
        rapide, pas une mesure exacte de laboratoire.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="self-start rounded-full border border-laiton-400/40 bg-laiton-400/[0.1] px-5 py-2.5 text-sm font-semibold text-laiton-200 transition hover:bg-laiton-400/[0.16] disabled:opacity-50"
      >
        {loading ? "Analyse en cours…" : "Prendre une photo de mon plat"}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {resultat && !resultat.analysable && (
        <p className="text-sm text-graphite-400">{resultat.resume ?? "Cette photo n'a pas pu être analysée."}</p>
      )}

      {resultat && resultat.analysable && (
        <div className="mt-2 flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4">
          {resultat.nomPlat && <p className="text-base font-semibold text-white">{resultat.nomPlat}</p>}
          {resultat.aliments.length > 0 && (
            <p className="text-xs text-graphite-400">{resultat.aliments.join(", ")}</p>
          )}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              ["Calories", resultat.caloriesEstimees, "kcal"],
              ["Protéines", resultat.proteinesG, "g"],
              ["Glucides", resultat.glucidesG, "g"],
              ["Lipides", resultat.lipidesG, "g"],
            ].map(([label, valeur, unite]) => (
              <div key={label as string} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center">
                <strong className="block font-display text-lg text-white">{valeur ?? "—"}</strong>
                <span className="text-[10px] uppercase tracking-wide text-graphite-500">{label} {valeur !== null ? unite : ""}</span>
              </div>
            ))}
          </div>
          {resultat.conseilCoach && (
            <div className="rounded-xl border border-laiton-400/25 bg-laiton-400/[0.07] px-3.5 py-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-laiton-300">Le conseil du coach COAI</p>
              <p className="mt-1.5 text-xs leading-5 text-graphite-100">{resultat.conseilCoach}</p>
            </div>
          )}
          {resultat.resume && <p className="text-xs italic leading-5 text-graphite-500">{resultat.resume}</p>}

          {/* L'estimation ne sert à rien si elle n'est pas comptée. Le bouton
              n'apparaît que si au moins les calories ont pu être estimées :
              enregistrer une ligne vide polluerait le journal. */}
          {resultat.caloriesEstimees !== null && (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                disabled={enregistrement === "envoi" || enregistrement === "ok"}
                onClick={async () => {
                  setEnregistrement("envoi");
                  try {
                    const r = await fetch("/api/repas", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        date: new Date().toISOString().slice(0, 10),
                        // L'estimation d'une photo ne dit rien de l'écart au
                        // plan : on n'invente pas un jugement, on enregistre
                        // le repas tel qu'il a été mangé.
                        statut: "COMME_PREVU",
                        libelle: resultat.nomPlat ?? (resultat.aliments.slice(0, 3).join(", ") || undefined),
                        calories: resultat.caloriesEstimees ?? undefined,
                        proteines: resultat.proteinesG ?? undefined,
                        glucides: resultat.glucidesG ?? undefined,
                        lipides: resultat.lipidesG ?? undefined,
                        notes: "Estimé depuis une photo — valeurs approximatives.",
                      }),
                    });
                    if (!r.ok) throw new Error();
                    setEnregistrement("ok");
                    router.refresh();
                  } catch {
                    setEnregistrement("erreur");
                  }
                }}
                className="rounded-full bg-laiton-300 px-5 py-2.5 text-sm font-bold text-[#101214] transition hover:bg-laiton-200 disabled:opacity-60"
              >
                {enregistrement === "envoi"
                  ? "Enregistrement…"
                  : enregistrement === "ok"
                    ? "Ajouté à ton journal ✓"
                    : "Ajouter à mon journal"}
              </button>
              {enregistrement === "erreur" && (
                <p className="text-[11px] text-red-400">Enregistrement impossible, réessaie.</p>
              )}
              {enregistrement === "ok" && (
                <p className="text-[11px] text-graphite-400">
                  Ces valeurs sont des estimations : ajuste-les depuis ton journal si besoin.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
