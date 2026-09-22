"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

type Status = "checking" | "active" | "inactive" | "error";

// Le paiement et la complétude du bilan sont deux étapes indépendantes.
// Ne monter ni l'activation du programme ni la confirmation visuelle avant
// que les droits aient été synchronisés, même si le bilan est absent.
export function CheckoutAccessGate({ sessionId, children }: { sessionId: string; children: ReactNode }) {
  // A different checkout owns a fresh verification lifecycle, including A→B→A.
  return <CheckoutSessionAccess key={sessionId} sessionId={sessionId}>{children}</CheckoutSessionAccess>;
}

function CheckoutSessionAccess({ sessionId, children }: { sessionId: string; children: ReactNode }) {
  const [result, setResult] = useState<{ sessionId: string; status: Status }>({ sessionId, status: "checking" });
  const [attempt, setAttempt] = useState(0);
  const status = result.sessionId === sessionId ? result.status : "checking";

  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    async function confirm() {
      try {
        const response = await fetch("/api/stripe/confirm-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok || data?.confirmed !== true || typeof data.accessActive !== "boolean") {
          throw new Error("Access not confirmed");
        }
        if (!disposed) setResult({ sessionId, status: data.accessActive ? "active" : "inactive" });
      } catch {
        if (!disposed) setResult({ sessionId, status: "error" });
      } finally {
        clearTimeout(timeout);
      }
    }
    void confirm();
    return () => {
      disposed = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [sessionId, attempt]);

  if (status === "active") return <>{children}</>;

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-5 py-10" aria-labelledby="checkout-access-title">
      <h1 id="checkout-access-title" className="font-display text-3xl font-semibold text-white">
        {status === "checking" ? "Nous activons ton accès." : status === "inactive" ? "Ton abonnement n’est pas actif." : "Ton accès reste à confirmer."}
      </h1>
      <p role="status" aria-live="polite" className="text-sm leading-6 text-graphite-300">
        {status === "checking"
          ? "Ton retour Stripe est bien reçu. Nous vérifions tes droits, cela peut prendre quelques secondes."
          : status === "inactive"
            ? "Les informations Stripe sont synchronisées, mais cet abonnement ne donne pas actuellement accès aux fonctions payantes. Retrouve son état dans ton compte."
            : "La vérification n’a pas abouti. Réessaie ou consulte ton abonnement. Si tu viens de payer, ne recommence pas le paiement."}
      </p>
      {status === "error" && (
        <button type="button" onClick={() => {
          setResult({ sessionId, status: "checking" });
          setAttempt(value => value + 1);
        }} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-laiton-400 px-5 py-3 font-semibold text-black">
          Réessayer la vérification
        </button>
      )}
      <Link href="/compte/abonnement" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-white">
        Voir mon abonnement
      </Link>
      <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center text-sm text-graphite-300 underline">
        Revenir à mon espace
      </Link>
      <noscript>Active JavaScript pour terminer la vérification, ou consulte ton abonnement depuis le lien ci-dessus.</noscript>
    </section>
  );
}
