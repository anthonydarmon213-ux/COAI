import * as Sentry from "@sentry/nextjs";
import { privateErrorOptions } from "./src/lib/analytics/error-privacy";

// Suivi d'erreurs best-effort : si le DSN n'est pas configuré, Sentry reste
// inactif sans jamais bloquer l'app (même logique que les autres
// intégrations optionnelles du projet : Make.com, Resend...).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    ...privateErrorOptions,
    debug: false,
  });
}
