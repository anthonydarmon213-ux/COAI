import * as Sentry from "@sentry/nextjs";
import { privateErrorOptions } from "./src/lib/analytics/error-privacy";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    ...privateErrorOptions,
    debug: false,
  });
}
