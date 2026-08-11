"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { NotificationAdaptation } from "@/lib/insight/derniere-adaptation";

const STORAGE_PREFIX = "coai_adaptation_vue_";

// "COAI a une adaptation à te proposer" (Phase 2, item 10) — dismissible
// localement (sessionStorage) : masquer la carte ne change rien côté
// serveur, une adaptation déjà appliquée (palier Impulsion) reste
// appliquée, une adaptation en attente (Transformation) reste soumise au
// coach. Volontairement pas de "rejet" qui annulerait une adaptation déjà
// vérifiée par les garde-fous du moteur — juste ne plus l'afficher.
export function AdaptationNotificationCard({ notification }: { notification: NotificationAdaptation }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const vue = sessionStorage.getItem(STORAGE_PREFIX + notification.id);
    setVisible(!vue);
  }, [notification.id]);

  function dismiss() {
    sessionStorage.setItem(STORAGE_PREFIX + notification.id, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const titre =
    notification.statut === "EN_ATTENTE"
      ? "COAI a une adaptation à te proposer"
      : "COAI a fait évoluer ton programme";

  return (
    <Card className="flex flex-col gap-3">
      <span className="font-mono text-xs uppercase tracking-wider text-laiton-400">{titre}</span>
      <p className="text-sm leading-6 text-graphite-200">{notification.resume}</p>
      <div className="flex flex-wrap gap-2">
        <Link href="/programme/evolution">
          <Button variant="secondary" className="px-4 py-2 text-xs">
            Voir les changements
          </Button>
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full border border-graphite-800 px-4 py-2 text-xs text-graphite-400 transition hover:text-white"
        >
          Garder mon programme actuel
        </button>
      </div>
    </Card>
  );
}
