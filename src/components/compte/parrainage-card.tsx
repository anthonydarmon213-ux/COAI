"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

type Filleul = {
  prenom: string | null;
  email: string;
  inscritLe: string;
  statut: "inscrit" | "en_essai" | "converti";
};

const STATUT_LABELS: Record<Filleul["statut"], string> = {
  inscrit: "Inscrit",
  en_essai: "En essai gratuit",
  converti: "Abonné payant — récompense appliquée",
};

// Chaque filleul qui devient abonné payant (fin de son essai gratuit de 7
// jours) fait gagner 1 mois offert au parrain, appliqué automatiquement sur
// sa prochaine facture (cf. webhooks/stripe/route.ts). La récompense du
// parrain reste 1 mois offert même si la durée de l'essai a changé.
export function ParrainageCard() {
  const [lien, setLien] = useState<string | null>(null);
  const [filleuls, setFilleuls] = useState<Filleul[]>([]);
  const [copie, setCopie] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/parrainage")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setLien(data.lien);
        setFilleuls(data.filleuls ?? []);
      })
      .catch(() => setErreur("Impossible de charger ton lien de parrainage."));
  }, []);

  async function copierLien() {
    if (!lien) return;
    await navigator.clipboard.writeText(lien);
    setCopie(true);
    setTimeout(() => setCopie(false), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Parrainage</SectionLabel>
      <Card className="flex flex-col gap-4">
        <p className="text-sm text-graphite-300">
          Partage ton lien — dès qu&apos;un filleul devient abonné payant (à la fin de son essai
          gratuit de 7 jours), tu reçois 1 mois offert sur ton propre abonnement.
        </p>

        {erreur && <p className="text-sm text-red-400">{erreur}</p>}

        {lien && (
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 rounded-lg border border-graphite-800 bg-graphite-900/40 px-3 py-2 text-sm text-graphite-200 break-all">
              {lien}
            </code>
            <button
              type="button"
              onClick={copierLien}
              className="rounded-lg bg-laiton-400 px-4 py-2 text-sm font-medium text-graphite-950 transition hover:bg-laiton-300"
            >
              {copie ? "Copié !" : "Copier"}
            </button>
          </div>
        )}

        {filleuls.length > 0 && (
          <div className="flex flex-col gap-1.5 border-t border-graphite-800 pt-3">
            <span className="font-mono text-[10px] uppercase tracking-widest text-graphite-500">
              Tes filleuls
            </span>
            {filleuls.map((f) => (
              <div key={f.email} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-graphite-300">{f.prenom || f.email}</span>
                <span className="text-graphite-500">{STATUT_LABELS[f.statut]}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
