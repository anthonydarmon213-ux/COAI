"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { clearParrainageCookie, readParrainageCookie } from "@/lib/parrainage/cookie";
import Link from "next/link";

export function CompleterInscriptionForm({ prenomSuggere }: { prenomSuggere: string }) {
  const [prenom, setPrenom] = useState(prenomSuggere);
  const [consentRgpd, setConsentRgpd] = useState(false);
  const [consentSante, setConsentSante] = useState(false);
  const [consentOffre, setConsentOffre] = useState(false);
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
    if (!consentOffre) {
      setError("La confirmation des conditions de l'offre d'essai est requise.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/compte/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consentRgpd,
          consentSante,
          prenom: prenom || undefined,
          parrainageCode: readParrainageCookie() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Impossible de finaliser la création du compte.");
      clearParrainageCookie();

      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "GRATUIT" }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok || !checkoutData.url) {
        throw new Error(checkoutData.error ?? "Impossible de démarrer l'offre d'essai.");
      }
      window.location.href = checkoutData.url;
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
      <label className="flex items-start gap-2 text-sm text-graphite-300">
        <input
          type="checkbox"
          checked={consentOffre}
          onChange={(e) => setConsentOffre(e.target.checked)}
          className="mt-1"
        />
        Je reconnais avoir pris connaissance des conditions de l&apos;offre : 1 mois d&apos;accès
        gratuit à compter de ce jour, puis passage automatique à un abonnement de 19€/mois, sauf
        résiliation avant la fin du mois gratuit. Je demande le début immédiat du service et
        reconnais renoncer à mon droit de rétractation de 14 jours pour la partie du service déjà
        utilisée durant le mois gratuit. J&apos;accepte les{" "}
        <Link href="/cgv" target="_blank" className="underline">
          CGV
        </Link>
        .
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Redirection vers le paiement…" : "Accéder à mon espace — 1 mois offert"}
      </Button>
    </form>
  );
}
