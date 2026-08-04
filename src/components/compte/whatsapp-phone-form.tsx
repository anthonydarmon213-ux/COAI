"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export function WhatsappPhoneForm({ phoneWhatsapp }: { phoneWhatsapp: string | null }) {
  const router = useRouter();
  const [phone, setPhone] = useState(phoneWhatsapp ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/compte/telephone", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneWhatsapp: phone.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ? JSON.stringify(data.error) : "Échec de l'enregistrement.");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field label="Numéro WhatsApp" error={error}>
        <Input
          type="tel"
          placeholder="+33612345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </Field>
      <p className="text-xs text-graphite-400">
        Format international, avec le +. C&apos;est ce numéro qui permet à l&apos;assistant
        WhatsApp de retrouver ton profil et ton programme.
      </p>
      {saved && !error && <p className="text-sm text-laiton-400">Numéro enregistré.</p>}
      <Button type="submit" disabled={loading} className="self-start">
        {loading ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
