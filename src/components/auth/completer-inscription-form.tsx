"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { clearParrainageCookie, readParrainageCookie } from "@/lib/parrainage/cookie";
import {
  readIntendedBillingCookie,
  readIntendedPlanCookie,
  readIntendedVipSessionsCookie,
} from "@/lib/checkout/intended-plan-cookie";
import { clearUtmCookie, readUtmCookie } from "@/lib/attribution/utm-cookie";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";
import Link from "next/link";

// La création du compte reste une étape réellement gratuite. Même si une
// offre a été repérée avant l'inscription, Stripe ne s'ouvre jamais sans une
// confirmation explicite sur l'écran des formules.
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
      const intendedBilling = readIntendedBillingCookie();
      clearParrainageCookie();
      clearUtmCookie();

      trackEvent("compte_cree", {});
      trackMetaEvent("CompleteRegistration");
      trackFunnelEvent("signup_completed", {});

      // Destination après inscription (01/09/2026, demande Anthony : « je veux
      // que la personne rentre direct dans l'interface après le diag »).
      //
      // Deux intentions différentes, deux destinations :
      // - venu des tarifs en ayant choisi une formule → on l'y ramène, sinon
      //   on lui fait perdre son achat en cours ;
      // - venu du diagnostic, sans formule choisie → il entre directement
      //   dans l'app. Le renvoyer vers /pricing lui montrait un prix avant
      //   d'avoir vu le produit : la friction que ce changement supprime.
      if (intendedPlan) {
        const params = new URLSearchParams({ from: "signup", selected: intendedPlan });
        params.set("billing", intendedBilling);
        params.set("vipSessions", String(intendedVipSessions));
        window.location.href = `/pricing?${params.toString()}`;
        return;
      }
      window.location.href = "/dashboard?from=signup";
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
        {loading ? "Création du compte…" : "Créer mon compte et choisir mon accompagnement →"}
      </Button>
    </form>
  );
}
