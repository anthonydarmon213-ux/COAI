"use client";

import { useRef, useState } from "react";

// Motion Check (22/08/2026, demande Anthony) — retour de technique à partir
// d'une photo prise en bas de mouvement.
//
// Photo plutôt que vidéo : la position en bas de mouvement porte
// l'essentiel de l'information technique, pour un coût en tokens sans
// commune mesure avec une vidéo. La consigne de prise de vue est affichée
// AVANT le déclenchement — une photo mal cadrée sera refusée par l'analyse,
// autant l'éviter dès le départ.
async function compresser(fichier: File): Promise<Blob> {
  const bitmap = await createImageBitmap(fichier);
  const LARGEUR_MAX = 1200;
  const ratio = Math.min(1, LARGEUR_MAX / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return fichier;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob((b) => r(b), "image/jpeg", 0.75));
  return blob && blob.size < fichier.size ? blob : fichier;
}

type Resultat = {
  analysable: boolean;
  phaseVisible: string | null;
  points: { repere: string; constat: string; statut: "ok" | "a_surveiller" }[];
  conseil: string | null;
  resume: string | null;
};

export function MotionCheck({ nomExercice }: { nomExercice: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [ouvert, setOuvert] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function analyser(fichier: File) {
    setChargement(true);
    setErreur(null);
    setResultat(null);
    try {
      const compresse = await compresser(fichier);
      const form = new FormData();
      form.append("file", compresse, "position.jpg");
      form.append("exercice", nomExercice);
      const res = await fetch("/api/programme/motion-check", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErreur(typeof data?.error === "string" ? data.error : "Analyse impossible pour le moment.");
        return;
      }
      setResultat(data as Resultat);
    } catch {
      setErreur("Analyse impossible pour le moment.");
    } finally {
      setChargement(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-graphite-300 transition hover:border-laiton-400/40 hover:text-white"
      >
        📹 Vérifier ma posture
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-black/75 p-4 sm:items-center" onClick={() => setOuvert(false)}>
          <div className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-laiton-400/25 bg-[#16181b] p-5 text-left" onClick={(e) => e.stopPropagation()}>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-300">📹 Motion Check</p>
            <h3 className="mt-1.5 text-base font-semibold text-white">{nomExercice}</h3>

            {!resultat && !chargement && (
              <>
                <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3">
                  <p className="text-xs font-semibold text-graphite-200">Pour une analyse fiable :</p>
                  <ul className="mt-1.5 flex flex-col gap-1 text-[11px] leading-4 text-graphite-400">
                    <li>• De profil, corps entier dans le cadre</li>
                    <li>• Photo prise en bas du mouvement</li>
                    <li>• Lumière suffisante, image nette</li>
                  </ul>
                </div>
                <p className="mt-2 text-[10px] leading-4 text-graphite-500">
                  La photo est analysée puis supprimée — elle n&apos;est jamais conservée.
                </p>
              </>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) analyser(f);
              }}
            />

            {erreur && <p className="mt-3 text-xs text-red-400">{erreur}</p>}

            {resultat && !resultat.analysable && (
              <div className="mt-3 rounded-xl border border-[#ff8a3d]/25 bg-[#ff8a3d]/[0.07] px-3.5 py-3">
                <p className="text-xs leading-5 text-[#ffb17d]">
                  {resultat.resume ?? "Cette photo ne permet pas d'analyser ta position."}
                </p>
              </div>
            )}

            {resultat?.analysable && (
              <div className="mt-3 flex flex-col gap-2">
                {resultat.phaseVisible && (
                  <span className="self-start rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-graphite-300">
                    {resultat.phaseVisible}
                  </span>
                )}

                {resultat.points.map((pt) => (
                  <div
                    key={pt.repere}
                    className={`rounded-xl border px-3.5 py-2.5 ${
                      pt.statut === "ok"
                        ? "border-emerald-500/25 bg-emerald-500/[0.07]"
                        : "border-[#ff8a3d]/25 bg-[#ff8a3d]/[0.07]"
                    }`}
                  >
                    <p className={`text-xs font-semibold ${pt.statut === "ok" ? "text-emerald-300" : "text-[#ffb17d]"}`}>
                      {pt.statut === "ok" ? "✓" : "!"} {pt.repere}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-graphite-300">{pt.constat}</p>
                  </div>
                ))}

                {resultat.conseil && (
                  <div className="rounded-xl border border-laiton-400/30 bg-laiton-400/[0.09] px-3.5 py-3">
                    <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-laiton-300">À la prochaine série</p>
                    <p className="mt-1 text-xs leading-5 text-laiton-100">{resultat.conseil}</p>
                  </div>
                )}

                <p className="text-[10px] leading-4 text-graphite-500">
                  Observation d&apos;une position sur une photo — ce n&apos;est ni un diagnostic ni un avis médical.
                </p>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={chargement}
                className="coai-rainbow-cta flex-1 rounded-full border-0 py-2.5 text-xs font-extrabold text-[#111216] disabled:opacity-60"
              >
                {chargement ? "Analyse…" : resultat ? "Nouvelle photo" : "Prendre la photo"}
              </button>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-white"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
