"use client";

import { useMemo, useState } from "react";
import { construireListeCourses } from "@/lib/nutrition/liste-courses";

// Liste de courses (22/08/2026, demande Anthony). Construite à partir du
// programme déjà chargé, sans aucun appel réseau ni LLM.
//
// Les cases cochées ne sont volontairement pas persistées : une liste de
// courses vit le temps d'un passage en magasin, et retrouver la semaine
// suivante des cases cochées de la semaine passée serait plus gênant
// qu'utile.
export function ListeCourses({ contenu }: { contenu: unknown }) {
  const [ouvert, setOuvert] = useState(false);
  const [coches, setCoches] = useState<Record<string, boolean>>({});
  const rayons = useMemo(() => construireListeCourses(contenu), [contenu]);

  if (rayons.length === 0) return null;

  const total = rayons.reduce((n, r) => n + r.lignes.length, 0);
  const cochees = Object.values(coches).filter(Boolean).length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="w-full rounded-full border border-laiton-400/35 bg-laiton-400/10 py-2.5 text-xs font-semibold text-laiton-200 transition hover:bg-laiton-400/20"
      >
        🛒 Ma liste de courses de la semaine
      </button>

      {ouvert && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/75 p-4 sm:items-center print:static print:bg-white print:p-0" onClick={() => setOuvert(false)}>
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-laiton-400/25 bg-[#16181b] p-5 text-left print:max-h-none print:border-0 print:bg-white print:text-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-laiton-300 print:text-black">🛒 Liste de courses</p>
                <h3 className="mt-1 text-base font-semibold text-white print:text-black">Ta semaine COAI</h3>
              </div>
              <span className="flex-none font-mono text-[10px] tabular-nums text-graphite-500 print:hidden">
                {cochees}/{total}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              {rayons.map((rayon) => (
                <div key={rayon.nom}>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-laiton-300 print:text-black">
                    {rayon.nom}
                  </p>
                  <div className="mt-1.5 flex flex-col gap-1">
                    {rayon.lignes.map((ligne) => {
                      const cle = `${rayon.nom}-${ligne.texte}`;
                      const coche = Boolean(coches[cle]);
                      return (
                        <button
                          key={cle}
                          type="button"
                          onClick={() => setCoches((c) => ({ ...c, [cle]: !c[cle] }))}
                          className="flex items-start gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-white/[0.04] print:hover:bg-transparent"
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded border text-[10px] ${
                              coche
                                ? "border-laiton-400 bg-laiton-400 text-[#111216]"
                                : "border-white/25 text-transparent print:border-black"
                            }`}
                          >
                            ✓
                          </span>
                          <span className={`text-xs leading-5 ${coche ? "text-graphite-500 line-through" : "text-graphite-100"} print:text-black print:no-underline`}>
                            {ligne.texte}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[10px] leading-4 text-graphite-500 print:hidden">
              Quantités issues de ton programme, à ajuster selon ce que tu as déjà chez toi.
            </p>

            <div className="mt-4 flex gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="coai-rainbow-cta flex-1 rounded-full border-0 py-2.5 text-xs font-extrabold text-[#111216]"
              >
                Imprimer
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
