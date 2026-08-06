"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Filet de sécurité App Router : capture les erreurs de rendu qui échappent
// aux boundaries locales et les envoie à Sentry avant d'afficher un écran de
// secours minimal.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-graphite-950 px-6 text-center text-graphite-50">
        <h1 className="text-2xl font-semibold">Une erreur est survenue</h1>
        <p className="max-w-md text-graphite-400">
          Anthony a été notifié. Réessaie dans quelques instants ou reviens à l&apos;accueil.
        </p>
        <a href="/" className="text-laiton-400 underline">
          Retour à l&apos;accueil
        </a>
      </body>
    </html>
  );
}
