"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Demande = {
  id: string;
  exercice: string;
  question: string | null;
  statut: "EN_ATTENTE" | "REPONDU";
  reponse: string | null;
  createdAt: string;
  repondueAt: string | null;
  videoUrl: string | null;
};

const TAILLE_MAX_MO = 60;

export function CorrectionMouvement({ exercices }: { exercices: string[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [exercice, setExercice] = useState("");
  const [question, setQuestion] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [demandes, setDemandes] = useState<Demande[] | null>(null);

  const charger = useCallback(async () => {
    const reponse = await fetch("/api/form-check");
    if (!reponse.ok) return setDemandes([]);
    const data = await reponse.json();
    setDemandes(data.demandes ?? []);
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const envoyer = useCallback(async () => {
    if (!fichier || !exercice) return;
    setEnvoi(true);
    setErreur(null);

    const corps = new FormData();
    corps.append("file", fichier);
    corps.append("exercice", exercice);
    corps.append("question", question);

    const reponse = await fetch("/api/form-check", { method: "POST", body: corps });
    const data = await reponse.json().catch(() => ({}));
    setEnvoi(false);

    if (!reponse.ok) {
      setErreur(data.error ?? "L'envoi a échoué. Réessaie.");
      return;
    }
    setFichier(null);
    setQuestion("");
    if (inputRef.current) inputRef.current.value = "";
    void charger();
  }, [fichier, exercice, question, charger]);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-6">
        <h2 className="font-display text-xl font-semibold text-white">
          Un doute sur ton mouvement ? Filme-le.
        </h2>
        <p className="mt-2 text-sm leading-6 text-graphite-300">
          Filme une série de face ou de profil, envoie-la, et Anthony te répond
          avec l&apos;ajustement précis à appliquer. Ta vidéo reste privée : elle
          n&apos;est visible que par lui.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-200">
              Quel exercice ?
            </span>
            <input
              list="coai-exercices"
              value={exercice}
              onChange={(e) => setExercice(e.target.value)}
              placeholder="Squat, développé couché…"
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-graphite-500"
            />
            <datalist id="coai-exercices">
              {exercices.map((nom) => (
                <option key={nom} value={nom} />
              ))}
            </datalist>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-200">
              Ta question <span className="text-graphite-500">(facultatif)</span>
            </span>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              placeholder="Je sens une gêne au bas du dos en remontant…"
              className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-graphite-500"
            />
          </label>

          {/* capture ouvre directement la caméra sur mobile : filmer sa série
              doit être un seul geste, pas un détour par la galerie. */}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            capture="environment"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f && f.size > TAILLE_MAX_MO * 1024 * 1024) {
                setErreur(`Vidéo trop lourde (${TAILLE_MAX_MO} Mo maximum). Filme une série plus courte.`);
                setFichier(null);
                return;
              }
              setErreur(null);
              setFichier(f);
            }}
            className="text-sm text-graphite-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-300/20 file:px-5 file:py-2.5 file:text-sm file:font-semibold file:text-cyan-100"
          />

          {erreur ? <p className="text-sm text-rose-300">{erreur}</p> : null}

          <button
            type="button"
            onClick={envoyer}
            disabled={!fichier || !exercice || envoi}
            className="self-start rounded-full bg-cyan-300 px-6 py-3 text-sm font-bold text-[#04121a] transition disabled:cursor-not-allowed disabled:opacity-40"
          >
            {envoi ? "Envoi en cours…" : "Envoyer à Anthony"}
          </button>
        </div>
      </section>

      <section>
        <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-graphite-400">
          Tes envois
        </h3>
        {demandes === null ? (
          <p className="mt-4 text-sm text-graphite-400">Chargement…</p>
        ) : demandes.length === 0 ? (
          <p className="mt-4 text-sm text-graphite-400">
            Tu n&apos;as encore envoyé aucune vidéo.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {demandes.map((d) => (
              <li key={d.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">{d.exercice}</p>
                  <span
                    className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
                      d.statut === "REPONDU"
                        ? "bg-emerald-400/15 text-emerald-200"
                        : "bg-amber-400/15 text-amber-200"
                    }`}
                  >
                    {d.statut === "REPONDU" ? "Réponse d'Anthony" : "En attente"}
                  </span>
                </div>
                {d.question ? (
                  <p className="mt-2 text-sm italic leading-6 text-graphite-400">« {d.question} »</p>
                ) : null}
                {d.videoUrl ? (
                  <video src={d.videoUrl} controls playsInline className="mt-4 max-h-72 w-full rounded-xl bg-black" />
                ) : null}
                {d.reponse ? (
                  <div className="mt-4 border-l-2 border-cyan-300/50 pl-4">
                    <p className="text-sm leading-6 text-white">{d.reponse}</p>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
