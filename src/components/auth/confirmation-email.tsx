"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { confirmationCallback, confirmationSendError } from "@/lib/auth/confirmation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ConfirmationEmail({ initialEmail = "", returnTo, initialCooldown = 0 }: {
  initialEmail?: string;
  returnTo?: string | null;
  initialCooldown?: number;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);
  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function resend(event: FormEvent) {
    event.preventDefault();
    if (sending.current || cooldown > 0) return;
    sending.current = true;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error: sendError } = await createSupabaseBrowserClient().auth.resend({
        type: "signup",
        email: email.trim(),
        options: { emailRedirectTo: confirmationCallback(window.location.origin, returnTo) },
      });
      if (sendError) throw sendError;
      // Réponse volontairement neutre : ne révèle pas l'existence d'un compte.
      setMessage("Si cette adresse attend une confirmation, un nouveau lien a été envoyé. Vérifie tes spams et ouvre le dernier email dans ce navigateur. Si ton compte est déjà confirmé, connecte-toi.");
    } catch (cause) {
      setError(confirmationSendError(cause));
    } finally {
      // Garde-fou UX ; les limites réelles restent imposées par Supabase.
      setCooldown(60);
      sending.current = false;
      setLoading(false);
    }
  }

  return <form onSubmit={resend} className="flex flex-col gap-3 rounded-xl border border-laiton-300/25 bg-laiton-300/[0.04] p-4 text-left">
    <p className="text-sm font-semibold text-graphite-100">Recevoir un nouveau lien de confirmation</p>
    <label className="text-sm text-graphite-300">Email utilisé pour l’inscription
      <Input className="mt-2" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
    </label>
    {message && <p role="status" className="text-sm leading-6 text-emerald-200">{message}</p>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <Button type="submit" disabled={loading || cooldown > 0}>
      {loading ? "Envoi…" : cooldown > 0 ? `Nouvel envoi dans ${cooldown} s` : "Renvoyer le lien"}
    </Button>
  </form>;
}
