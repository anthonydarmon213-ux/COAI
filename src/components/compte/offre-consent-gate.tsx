"use client";

import { useState } from "react";
import Link from "next/link";

// Nouveau modèle d'accès libre (13/08/2026) : l'inscription ne capture plus
// aucun engagement de paiement (elle est gratuite, cf. sign-up). Cette
// reconnaissance des conditions de l'offre — jusque-là recueillie une seule
// fois à l'inscription — doit donc être recueillie ici, juste avant chaque
// achat réel (abonnement Impulsion, Transformation ou VIP), quel que
// soit l'endroit d'où l'action est déclenchée (dashboard, page de pilier,
// /pricing). Affiche le bouton d'achat réel (children) seulement une fois
// la case cochée. Le CTA reste visible pour que le prospect comprenne tout
// de suite l'action attendue ; il est simplement désactivé jusqu'au consentement.
export function OffreConsentGate({
  resumeConditions,
  children,
}: {
  resumeConditions: React.ReactNode;
  children: React.ReactNode;
}) {
  const [consenti, setConsenti] = useState(false);

  return (
    <div className="flex w-full flex-col gap-3 text-left">
      <div className="rounded-xl border border-graphite-800 bg-graphite-900/40 p-4">
      <label className="flex cursor-pointer items-start gap-2 text-sm leading-5 text-graphite-200">
        <input
          type="checkbox"
          checked={consenti}
          onChange={(e) => setConsenti(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#c9a262]"
        />
        <span>J&apos;ai compris les conditions de l&apos;offre et j&apos;accepte les{" "}
          <Link href="/cgv" target="_blank" className="underline">
            CGV
          </Link>
          .
        </span>
      </label>
      <details className="mt-3 pl-6 text-xs leading-5 text-graphite-400">
        <summary className="cursor-pointer text-graphite-300">Voir le détail des conditions</summary>
        <p className="mt-2">{resumeConditions}</p>
      </details>
      </div>
      <fieldset disabled={!consenti} className="w-full disabled:cursor-not-allowed disabled:opacity-45">
        {children}
      </fieldset>
      {!consenti && <p className="text-center text-xs text-graphite-500">Coche la case pour continuer</p>}
    </div>
  );
}
