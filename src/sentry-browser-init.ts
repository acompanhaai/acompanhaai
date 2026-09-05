import * as Sentry from "@sentry/tanstackstart-react";

const dsn = import.meta.env["VITE_SENTRY_DSN"] as string | undefined;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
  });
}
