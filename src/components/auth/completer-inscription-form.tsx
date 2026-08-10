"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { clearParrainageCookie, readParrainageCookie } from "@/lib/parrainage/cookie";
import { clearIntendedPlanCookie } from "@/lib/checkout/intended-plan-cookie";
import Link from "next/link";

export function CompleterInscriptionForm({
  prenomSuggere,
  planInitial,
}: {
  prenomSuggere: string;
  planInitial: "GRATUIT" | "STANDARD";
}) {
  // 11/08/2026 : Transformation propose désormais le même choix "7 jours
  // offerts" / "démarrer tout de suite" qu'Impulsion (avant ça,
  // Transformation passait toujours par l'essai, sans option immédiate).
  const nomFormule = planInitial === "STANDARD" ? "Transformation" : "Impulsion";
  const prixMensuel = planInitial === "STANDARD" ? "49€" : "19€";

  const [prenom, setPrenom] = useState(prenomSuggere);
  const [consentRgpd, setConsentRgpd] = useState(false);
  const [consentSante, setConsentSante] = useState(false);
  const [consentOffre, setConsentOffre] = useState(false);
  const [skipTrial, setSkipTrial] = useState(false);
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
      setError("La confirmation des conditions de l'offre est requise.");
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
      clearIntendedPlanCookie();

      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planInitial, skipTrial }),
      });
      const checkoutData = await checkoutRes.json();
      if (!checkoutRes.ok || !checkoutData.url) {
        throw new Error(checkoutData.error ?? "Impossible de démarrer l'abonnement.");
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
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-graphite-500">
          Formule {nomFormule} — {prixMensuel}/mois
          {planInitial === "STANDARD" && " · programme relu par un coach diplômé d'État"}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSkipTrial(false)}
            className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition ${
              !skipTrial
                ? "border-laiton-400/40 bg-laiton-400/10 text-laiton-200"
                : "border-graphite-800 text-graphite-400 hover:text-white"
            }`}
          >
            <span className="block font-semibold">7 jours offerts</span>
            <span className="block text-graphite-500">puis {prixMensuel}/mois</span>
          </button>
          <button
            type="button"
            onClick={() => setSkipTrial(true)}
            className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs transition ${
              skipTrial
                ? "border-laiton-400/40 bg-laiton-400/10 text-laiton-200"
                : "border-graphite-800 text-graphite-400 hover:text-white"
            }`}
          >
            <span className="block font-semibold">Démarrer tout de suite</span>
            <span className="block text-graphite-500">{prixMensuel}/mois dès aujourd&apos;hui</span>
          </button>
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm text-graphite-300">
        <input
          type="checkbox"
          checked={consentOffre}
          onChange={(e) => setConsentOffre(e.target.checked)}
          className="mt-1"
        />
        {skipTrial ? (
          <>
            Je reconnais avoir pris connaissance des conditions de l&apos;offre : abonnement
            {" "}
            {nomFormule} à {prixMensuel}/mois, facturé immédiatement dès l&apos;inscription
            (sans période d&apos;essai). Je demande le début immédiat du service et reconnais
            renoncer à mon droit de rétractation de 14 jours pour la partie du service déjà
            utilisée. J&apos;accepte les{" "}
            <Link href="/cgv" target="_blank" className="underline">
              CGV
            </Link>
            .
          </>
        ) : (
          <>
            Je reconnais avoir pris connaissance des conditions de l&apos;offre {nomFormule} : 7
            jours d&apos;accès gratuit à compter de ce jour, puis passage automatique à un
            abonnement de {prixMensuel}/mois, sauf résiliation avant la fin des 7 jours. Je
            demande le début immédiat du service et reconnais renoncer à mon droit de
            rétractation de 14 jours pour la partie du service déjà utilisée durant la période
            offerte. J&apos;accepte les{" "}
            <Link href="/cgv" target="_blank" className="underline">
              CGV
            </Link>
            .
          </>
        )}
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading
          ? "Redirection vers le paiement…"
          : skipTrial
            ? `Démarrer maintenant — ${prixMensuel}/mois`
            : "Accéder à mon espace — 7 jours offerts"}
      </Button>
    </form>
  );
}
