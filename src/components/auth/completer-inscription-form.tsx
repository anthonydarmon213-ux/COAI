"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { clearParrainageCookie, readParrainageCookie } from "@/lib/parrainage/cookie";
import { clearIntendedPlanCookie } from "@/lib/checkout/intended-plan-cookie";
import { clearUtmCookie, readUtmCookie } from "@/lib/attribution/utm-cookie";
import { trackEvent, trackMetaEvent } from "@/lib/analytics";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";
import Link from "next/link";

export function CompleterInscriptionForm({
  prenomSuggere,
  planInitial,
}: {
  prenomSuggere: string;
  planInitial: "GRATUIT" | "STANDARD";
}) {
  const nomFormule = planInitial === "STANDARD" ? "Transformation" : "Impulsion";
  const prixMensuel = planInitial === "STANDARD" ? "49€" : "19€";

  const [prenom, setPrenom] = useState(prenomSuggere);
  const [consentRgpd, setConsentRgpd] = useState(false);
  const [consentSante, setConsentSante] = useState(false);
  const [consentOffre, setConsentOffre] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    trackFunnelEvent("signup_started", { plan: planInitial });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      clearParrainageCookie();
      clearIntendedPlanCookie();
      clearUtmCookie();

      // 11/08/2026 : même signal que sur le flow email/mot de passe
      // (sign-up/page.tsx) — jusqu'ici seule l'inscription Google n'envoyait
      // pas cet événement, un trou dans la couverture du funnel.
      trackEvent("compte_cree", { plan: planInitial });
      trackMetaEvent("CompleteRegistration");
      trackFunnelEvent("signup_completed", { plan: planInitial });
      trackFunnelEvent("checkout_started", { plan: planInitial });

      const checkoutRes = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planInitial }),
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
      {planInitial === "STANDARD" ? (
        // Carte premium (11/08/2026, correction Anthony) — même traitement
        // que sign-up/page.tsx, cf. ce fichier pour le détail de la décision.
        // UI uniquement, aucune logique Stripe/trial touchée.
        <div className="flex flex-col gap-3 rounded-2xl border border-laiton-400/40 bg-laiton-400/[0.07] p-4">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-laiton-300">
            Transformation
          </span>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-display text-2xl font-semibold tracking-tight text-laiton-300">
              7 jours offerts
            </span>
            <span className="text-sm text-graphite-300">puis {prixMensuel}/mois</span>
          </div>
          <ul className="flex flex-col gap-1.5 text-sm leading-5 text-graphite-200">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-laiton-400">✓</span>
              <span>Programme personnalisé généré immédiatement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-laiton-400">✓</span>
              <span>Entraînement · nutrition · récupération</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-laiton-400">✓</span>
              <span>Programme relu et validé par un coach diplômé d&apos;État</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-laiton-400">✓</span>
              <span>Coach IA illimité</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-laiton-400">✓</span>
              <span>1 visio/mois avec Anthony incluse</span>
            </li>
          </ul>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-graphite-500">
            Formule {nomFormule} — {prixMensuel}/mois
          </span>
          <p className="text-xs leading-5 text-graphite-500">
            Ton programme COAI est disponible immédiatement. Profite de COAI gratuitement pendant
            7 jours, puis {prixMensuel}/mois. Résiliable avant la fin de l&apos;essai.
          </p>
        </div>
      )}
      <label className="flex items-start gap-2 text-sm text-graphite-300">
        <input
          type="checkbox"
          checked={consentOffre}
          onChange={(e) => setConsentOffre(e.target.checked)}
          className="mt-1"
        />
        Je reconnais avoir pris connaissance des conditions de l&apos;offre {nomFormule} : 7 jours
        d&apos;accès gratuit à compter de ce jour, puis passage automatique à un abonnement de
        {" "}
        {prixMensuel}/mois, sauf résiliation avant la fin des 7 jours. Je demande le début
        immédiat du service et reconnais renoncer à mon droit de rétractation de 14 jours pour la
        partie du service déjà utilisée durant la période offerte. J&apos;accepte les{" "}
        <Link href="/cgv" target="_blank" className="underline">
          CGV
        </Link>
        .
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading
          ? "Redirection vers le paiement…"
          : planInitial === "STANDARD"
            ? "Commencer mes 7 jours offerts"
            : "Commencer gratuitement"}
      </Button>
    </form>
  );
}
