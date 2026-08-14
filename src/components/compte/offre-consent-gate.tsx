"use client";

import { useState } from "react";
import Link from "next/link";

// Nouveau modèle d'accès libre (13/08/2026) : l'inscription ne capture plus
// aucun engagement de paiement (elle est gratuite, cf. sign-up). Cette
// reconnaissance des conditions de l'offre — jusque-là recueillie une seule
// fois à l'inscription — doit donc être recueillie ici, juste avant chaque
// achat réel (génération one-shot ou abonnement Transformation), quel que
// soit l'endroit d'où l'action est déclenchée (dashboard, page de pilier,
// /pricing). Affiche le bouton d'achat réel (children) seulement une fois
// la case cochée.
export function OffreConsentGate({
  resumeConditions,
  children,
}: {
  resumeConditions: React.ReactNode;
  children: React.ReactNode;
}) {
  const [consenti, setConsenti] = useState(false);

  if (consenti) return <>{children}</>;

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-graphite-800 bg-graphite-900/40 p-4 text-left">
      <label className="flex items-start gap-2 text-xs leading-5 text-graphite-300">
        <input
          type="checkbox"
          onChange={(e) => setConsenti(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          {resumeConditions} J&apos;accepte les{" "}
          <Link href="/cgv" target="_blank" className="underline">
            CGV
          </Link>
          .
        </span>
      </label>
    </div>
  );
}
