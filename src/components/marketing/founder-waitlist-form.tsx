"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function FounderWaitlistForm() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profile, setProfile] = useState("");
  const [objective, setObjective] = useState("");
  const [consentRgpd, setConsentRgpd] = useState(false);
  const [contactConsent, setContactConsent] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/liste-attente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          email,
          phone,
          profile,
          objective,
          consentRgpd,
          contactConsent,
          website: String(formData.get("website") ?? ""),
          elapsedMs: Date.now() - startedAt,
        }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Impossible de rejoindre la liste pour le moment.");
      }

      setStatus("success");
      setMessage(
        `Merci ${firstName}, ta demande est confirmée. Bienvenue parmi les membres fondateurs YUMAI.`
      );
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 text-left">
      <label htmlFor="founder-first-name" className="text-sm font-medium text-graphite-200">
        Prénom
      </label>
      <Input
        id="founder-first-name"
        name="firstName"
        autoComplete="given-name"
        required
        minLength={2}
        maxLength={80}
        value={firstName}
        onChange={(event) => setFirstName(event.target.value)}
        placeholder="Ton prénom"
      />
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
      <label htmlFor="founder-phone" className="text-sm font-medium text-graphite-200">
        Téléphone / WhatsApp <span className="font-normal text-graphite-400">(facultatif)</span>
      </label>
      <Input
        id="founder-phone"
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={30}
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="Ex. +33 6 12 34 56 78"
      />
      <label htmlFor="founder-profile" className="text-sm font-medium text-graphite-200">
        Ton profil
      </label>
      <Select
        id="founder-profile"
        name="profile"
        required
        value={profile}
        onChange={(event) => setProfile(event.target.value)}
      >
        <option value="" disabled>
          Sélectionne ton profil
        </option>
        <option value="dirigeant">Dirigeant ou entrepreneur</option>
        <option value="independant">Indépendant ou profession libérale</option>
        <option value="cadre">Cadre ou manager</option>
        <option value="sportif">Sportif régulier</option>
        <option value="reprise">Reprise ou débutant</option>
        <option value="autre">Autre profil</option>
      </Select>
      <label htmlFor="founder-objective" className="text-sm font-medium text-graphite-200">
        Ton objectif prioritaire
      </label>
      <Textarea
        id="founder-objective"
        name="objective"
        required
        minLength={10}
        maxLength={1000}
        rows={4}
        value={objective}
        onChange={(event) => setObjective(event.target.value)}
        placeholder="Ex. retrouver de l'énergie, progresser durablement, reprendre une routine…"
      />
      <div className="hidden" aria-hidden="true">
        <label htmlFor="founder-website">Site internet</label>
        <input
          id="founder-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <label className="flex items-start gap-2 text-xs text-graphite-400">
        <input
          type="checkbox"
          required
          checked={consentRgpd}
          onChange={(event) => setConsentRgpd(event.target.checked)}
          className="mt-0.5"
        />
        J&apos;accepte que YUMAI traite ces informations pour gérer ma demande et
        m&apos;envoyer les actualités liées au lancement. Je pourrai retirer mon
        consentement à tout moment.
      </label>
      <label className="flex items-start gap-2 text-xs text-graphite-400">
        <input
          type="checkbox"
          required={phone.trim().length > 0}
          checked={contactConsent}
          onChange={(event) => setContactConsent(event.target.checked)}
          className="mt-0.5"
        />
        J&apos;accepte d&apos;être contacté par téléphone ou WhatsApp au sujet de ma demande.
        Cette autorisation est requise uniquement si je renseigne un numéro.
      </label>
      <Button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className="w-full"
      >
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
