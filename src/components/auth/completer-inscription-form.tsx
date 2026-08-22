"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { clearParrainageCookie, readParrainageCookie } from "@/lib/parrainage/cookie";
import {
  clearIntendedPlanCookie,
  readIntendedPlanCookie,
  readIntendedVipSessionsCookie,
} from "@/lib/checkout/intended-plan-cookie";
import { clearUtmCookie, readUtmCookie } from "@/lib/attribution/utm-cookie";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";
import Link from "next/link";

// Le "accès libre" du 13/08/2026 (aucun paiement déclenché ici, même quand
// un plan était visé) reste le comportement par défaut d'un compte sans
// intention déclarée. Corrigé le 20/08/2026 (demande Anthony, sortie du
// diagnostic public) : quand coai_plan existe, on ne redirige plus vers
// /pricing pour un second clic — on déclenche directement /api/stripe/checkout
// (7 jours offerts, carte requise dès l'essai pour Pass IA/Coaching Hybride).
// Sans cookie d'intention (signup "nu", parcours toujours gratuit), rien ne
// change : direction /bienvenue comme avant.
export function CompleterInscriptionForm({ prenomSuggere }: { prenomSuggere: string }) {
  const [prenom, setPrenom] = useState(prenomSuggere);
  const [consentRgpd, setConsentRgpd] = useState(false);
  const [consentSante, setConsentSante] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!consentRgpd) {
      setError("Le consentement au traitement des données de santé est requis.");
      return;
    }
    if (!consentSante) {
      setError("La certification d'aptitude sportive est requise.");
      return;
    }

    setLoading(true);
    try {
      const utm = readUtmCookie();
      const res = await fetch("/api/compte/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentRgpd,
          consentSante,
          prenom: prenom || undefined,
          parrainageCode: readParrainageCookie() || undefined,
          ...utm,
        }),
      });
      if (!res.ok) throw new Error("Impossible de finaliser la création du compte.");
      const intendedPlan = readIntendedPlanCookie();
      const intendedVipSessions = readIntendedVipSessionsCookie();
      clearParrainageCookie();
      clearIntendedPlanCookie();
      clearUtmCookie();

      trackEvent("compte_cree", {});
      trackMetaEvent("CompleteRegistration");
      trackFunnelEvent("signup_completed", {});

      if (intendedPlan) {
        const checkoutRes = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: intendedPlan, vipSessions: intendedVipSessions }),
        });
        const checkoutData = await checkoutRes.json().catch(() => null);
        if (checkoutRes.ok && checkoutData?.url) {
          window.location.href = checkoutData.url;
          return;
        }
        // Checkout indisponible (Stripe en échec, etc.) : direction /pricing
        // plutôt que de bloquer l'utilisateur sur une erreur sans issue —
        // il retrouve son compte créé et peut réessayer depuis là.
        window.location.href = `/pricing#${intendedPlan === "GRATUIT" ? "autonome" : intendedPlan === "STANDARD" ? "hybride" : "vip"}`;
        return;
      }

      window.location.href = "/bienvenue";
    } catch (err) {
      console.error("[completer-inscription]", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Prénom">
        <Input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
      </Field>
      <label className="flex items-start gap-2 text-sm text-graphite-300">
        <input
          type="checkbox"
          checked={consentRgpd}
          onChange={(e) => setConsentRgpd(e.target.checked)}
          className="mt-1"
        />
        J&apos;ai lu la{" "}
        <Link href="/confidentialite" target="_blank" className="underline">
          politique de confidentialité
        </Link>{" "}
        et je consens au traitement de mes données de santé pour la personnalisation de mon
        coaching (RGPD).
      </label>
      <label className="flex items-start gap-2 text-sm text-graphite-300">
        <input
          type="checkbox"
          checked={consentSante}
          onChange={(e) => setConsentSante(e.target.checked)}
          className="mt-1"
        />
        Je certifie être apte à la pratique sportive, ou avoir consulté un médecin en cas de doute
        ou d&apos;antécédent médical.
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Création du compte…" : "Créer mon compte gratuit"}
      </Button>
    </form>
  );
}
