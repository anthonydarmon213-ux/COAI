"use client";

import { useState } from "react";
import { OFFRE_RENTREE_LABEL, PROGRAMME_UNITAIRE_PRIX_LABEL } from "@/lib/programmes-prets/offre";

type ChoixProgramme = { slug: string; nom: string };

export function ProgrammePurchaseButton({
  programmePrincipal,
  choixOfferts,
  connecte,
}: {
  programmePrincipal: ChoixProgramme;
  choixOfferts: ChoixProgramme[];
  connecte: boolean;
}) {
  const [programmeOffert, setProgrammeOffert] = useState(choixOfferts[0]?.slug ?? "");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [consentement, setConsentement] = useState(false);

  async function acheter() {
    if (!connecte) {
      window.location.href = `/sign-in?redirect_to=${encodeURIComponent("/boutique")}`;
      return;
    }
    if (!programmeOffert) return;

    setChargement(true);
    setErreur(null);
    try {
      const response = await fetch("/api/stripe/checkout-programme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programmePrincipal: programmePrincipal.slug,
          programmeOffert,
          consentAccesImmediat: consentement,
        }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? "Paiement indisponible");
      window.location.href = data.url;
    } catch (error) {
      setErreur(error instanceof Error ? error.message : "Paiement indisponible");
      setChargement(false);
    }
  }

  return (
    <div className="rounded-xl border border-laiton-300/30 bg-laiton-400/[0.07] p-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-laiton-200">
        Tarif lancement {PROGRAMME_UNITAIRE_PRIX_LABEL} · {OFFRE_RENTREE_LABEL}
      </p>
      <label className="mt-2 block text-[11px] text-graphite-300">
        Choisis ton programme offert
        <select
          value={programmeOffert}
          onChange={(event) => setProgrammeOffert(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#0c0f11] px-2.5 py-2 text-xs text-white outline-none focus:border-laiton-300"
        >
          {choixOfferts.map((programme) => (
            <option key={programme.slug} value={programme.slug}>{programme.nom}</option>
          ))}
        </select>
      </label>
      <label className="mt-2.5 flex items-start gap-2 text-[10px] leading-4 text-graphite-400">
        <input
          type="checkbox"
          checked={consentement}
          onChange={(event) => setConsentement(event.target.checked)}
          className="mt-0.5 accent-[#c49a52]"
        />
        <span>
          Je demande l&apos;accès immédiat aux contenus numériques et reconnais perdre mon droit de
          rétractation dès leur mise à disposition. J&apos;accepte les <a href="/cgv" target="_blank" className="underline hover:text-white">CGV</a>.
        </span>
      </label>
      <button
        type="button"
        onClick={acheter}
        disabled={chargement || !programmeOffert || !consentement}
        className="mt-2.5 w-full rounded-full bg-laiton-300 px-4 py-2.5 text-xs font-bold text-[#101214] transition hover:bg-laiton-200 disabled:cursor-wait disabled:opacity-60"
      >
        {chargement
          ? "Ouverture du paiement…"
          : connecte
            ? `Acheter ce programme · ${PROGRAMME_UNITAIRE_PRIX_LABEL}`
            : "Se connecter pour acheter"}
      </button>
      <p className="mt-1.5 text-[10px] leading-4 text-graphite-500">
        Paiement unique · accès permanent aux deux programmes · sans abonnement
      </p>
      {erreur && <p className="mt-1.5 text-[10px] text-red-300" role="alert">{erreur}</p>}
    </div>
  );
}
