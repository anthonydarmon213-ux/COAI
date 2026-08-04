"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FounderWaitlistForm() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/liste-attente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Impossible de rejoindre la liste pour le moment.");
      }

      setStatus("success");
      setMessage("Bienvenue dans le Cercle Fondateur. Nous te tiendrons informé en priorité.");
      setEmail("");
      setConsent(false);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 text-left">
      <label htmlFor="founder-email" className="text-sm font-medium text-graphite-200">
        Ton adresse e-mail
      </label>
      <Input
        id="founder-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="toi@exemple.fr"
      />
      <label className="flex items-start gap-2 text-xs text-graphite-400">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5"
        />
        J&apos;accepte de recevoir par e-mail les informations de lancement et d&apos;accès
        prioritaire. Je pourrai retirer mon consentement à tout moment.
      </label>
      <Button type="submit" disabled={status === "loading"} className="w-full">
        {status === "loading" ? "Inscription…" : "Rejoindre la liste prioritaire"}
      </Button>
      {message ? (
        <p
          role="status"
          className={`text-sm ${status === "error" ? "text-red-400" : "text-emerald-400"}`}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
