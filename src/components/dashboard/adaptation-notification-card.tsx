"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";
import type { NotificationAdaptation } from "@/lib/insight/derniere-adaptation";

const STORAGE_PREFIX = "coai_adaptation_vue_";

// "COAI a une adaptation à te proposer" (Phase 2, point 10) — quand une
// adaptation est PROPOSEE (pas encore appliquée, cf. src/lib/adaptation/
// engine.ts), cette carte porte le vrai geste "Accepter" / "Garder mon
// programme actuel" : rien n'est régénéré tant que l'utilisateur n'a pas
// cliqué Accepter. Pour une adaptation déjà traitée (appliquée ou en
// attente du coach), la carte reste informative et simplement dismissible
// (sessionStorage) — il n'y a plus rien à décider.
export function AdaptationNotificationCard({
  notification,
  plan,
}: {
  notification: NotificationAdaptation;
  plan: "GRATUIT" | "STANDARD" | "PREMIUM";
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [etat, setEtat] = useState<"attente" | "accepte" | "rejete">("attente");
  const [loading, setLoading] = useState<"confirmer" | "rejeter" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const vue = sessionStorage.getItem(STORAGE_PREFIX + notification.id);
    setVisible(!vue);
  }, [notification.id]);

  function dismiss() {
    sessionStorage.setItem(STORAGE_PREFIX + notification.id, "1");
    setVisible(false);
  }

  async function handleConfirmer() {
    setLoading("confirmer");
    setError(null);
    try {
      const res = await fetch(`/api/adaptations/${notification.id}/confirmer`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de la confirmation.");
      setEtat("accepte");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(null);
    }
  }

  async function handleRejeter() {
    setLoading("rejeter");
    setError(null);
    try {
      const res = await fetch(`/api/adaptations/${notification.id}/rejeter`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec.");
      setEtat("rejete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(null);
    }
  }

  if (!visible) return null;

  const enAttenteConfirmation = notification.statut === "PROPOSEE" && etat === "attente";

  // Moment d'upgrade contextuel Free→Pro (Phase 5B, 11/08/2026, parcours E)
  // — une décision REDUIRE signale un ajustement de prudence (fatigue,
  // plateau, contrainte...) : c'est précisément le genre de moment où un
  // coach humain apporte une vraie valeur. Jamais affiché en dehors de ce
  // contexte précis (pas de paywall générique plaqué partout).
  const momentUpgrade = plan === "GRATUIT" && notification.decision === "REDUIRE";

  const titre =
    etat === "accepte"
      ? "Adaptation appliquée"
      : etat === "rejete"
        ? "Programme inchangé"
        : notification.statut === "PROPOSEE"
          ? "COAI a une adaptation à te proposer"
          : notification.statut === "EN_ATTENTE"
            ? "En attente de validation par ton coach"
            : "COAI a fait évoluer ton programme";

  return (
    <Card className="flex flex-col gap-3">
      <span className="font-mono text-xs uppercase tracking-wider text-laiton-400">{titre}</span>
      <p className="text-sm leading-6 text-graphite-200">{notification.resume}</p>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {enAttenteConfirmation ? (
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleConfirmer} disabled={loading !== null} className="px-4 py-2 text-xs">
            {loading === "confirmer" ? "Application…" : "Accepter"}
          </Button>
          <button
            type="button"
            onClick={handleRejeter}
            disabled={loading !== null}
            className="rounded-full border border-graphite-800 px-4 py-2 text-xs text-graphite-400 transition hover:text-white disabled:opacity-50"
          >
            {loading === "rejeter" ? "…" : "Garder mon programme actuel"}
          </button>
        </div>
      ) : (
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
            OK
          </button>
        </div>
      )}

      {momentUpgrade && (
        <Link
          href="/pricing"
          onClick={() => trackFunnelEvent("plan_selected", { plan: "STANDARD", contexte: "adaptation_reduire" })}
          className="flex items-center justify-between rounded-xl border border-laiton-400/25 bg-laiton-400/[0.06] px-4 py-3 text-sm text-laiton-200 transition hover:bg-laiton-400/[0.1]"
        >
          <span>Un coach diplômé d&apos;État peut t&apos;accompagner sur ce type d&apos;ajustement.</span>
          <span className="whitespace-nowrap font-mono text-xs uppercase tracking-wide">
            Découvrir Coaching Hybride →
          </span>
        </Link>
      )}
    </Card>
  );
}
