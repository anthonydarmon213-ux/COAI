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
  // Une adresse modifiée ici appartient à l'utilisateur, pas au formulaire parent.
  const [editedEmail, setEmail] = useState<string | null>(null);
  const email = editedEmail ?? initialEmail;
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(() => {
    const seconds = Number.isFinite(initialCooldown) ? Math.max(0, Math.ceil(initialCooldown)) : 0;
    return { until: Date.now() + seconds * 1000, seconds };
  });
  const cooldown = waiting.seconds;
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sending = useRef(false);
  const nextAllowedAt = useRef(waiting.until);
  const waitingActive = cooldown > 0;
  useEffect(() => {
    if (!waitingActive) return;
    const refresh = () => setWaiting(current => {
      const seconds = Math.max(0, Math.ceil((current.until - Date.now()) / 1000));
      return seconds === current.seconds ? current : { ...current, seconds };
    });
    const timer = window.setInterval(refresh, 1000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, [waitingActive, waiting.until]);

  async function resend(event: FormEvent) {
    event.preventDefault();
    if (sending.current || Date.now() < nextAllowedAt.current) return;
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
      nextAllowedAt.current = Date.now() + 60_000;
      setWaiting({ until: nextAllowedAt.current, seconds: 60 });
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
