import type { ErrorEvent, EventHint } from "@sentry/nextjs";

// Shared by browser, Node and Edge. Explicit allow-list: never copy arbitrary
// error messages, request data, health notes, breadcrumbs or custom contexts.
export function privateErrorReport(event: ErrorEvent, hint: EventHint): ErrorEvent {
  hint.attachments = [];
  const safe: ErrorEvent = { type: undefined, level: "error", platform: "javascript" };
  if (/^[a-f0-9]{32}$/i.test(event.event_id ?? "")) safe.event_id = event.event_id;
  if (typeof event.timestamp === "number" && Number.isFinite(event.timestamp)) safe.timestamp = event.timestamp;
  if (/^[a-f0-9]{40}$/i.test(event.release ?? "")) safe.release = event.release;
  const types = new Set(["Error", "TypeError", "RangeError", "ReferenceError", "SyntaxError", "URIError", "EvalError"]);
  safe.exception = { values: (event.exception?.values?.length ? event.exception.values : [{}]).slice(0, 5).map(exception => ({
    type: types.has(exception.type ?? "") ? exception.type : "Error",
    value: "Erreur COAI — contenu privé retiré",
    stacktrace: { frames: (exception.stacktrace?.frames ?? []).slice(-50).flatMap(frame => {
      // Keep only compiled same-site browser assets, with no query/fragment.
      // Server paths/source variables are deliberately excluded pending audit.
      let path: string;
      try {
        const url = new URL(frame.filename ?? "", "https://coai.fr");
        if (url.protocol !== "https:" || !["coai.fr", "www.coai.fr"].includes(url.hostname)
            || url.username || url.password || url.port) return [];
        path = url.pathname;
      } catch { return []; }
      if (!/^\/_next\/static\/chunks\/[a-zA-Z0-9/_-]+\.js$/.test(path)) return [];
      return [{ filename: `https://coai.fr${path}`,
        ...(Number.isSafeInteger(frame.lineno) && frame.lineno! > 0 ? { lineno: frame.lineno } : {}),
        ...(Number.isSafeInteger(frame.colno) && frame.colno! > 0 ? { colno: frame.colno } : {}),
      }];
    }) },
  })) };
  return safe;
}

export const privateErrorOptions = {
  sendDefaultPii: false,
  dataCollection: {
    userInfo: false, cookies: false, httpHeaders: { request: false, response: false },
    httpBodies: [], urlQueryParams: false, graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false }, databaseQueryData: false,
    stackFrameVariables: false, frameContextLines: 0,
  },
  // Unfiltered transactions can carry route names, SQL or coaching inputs.
  // Re-enable only after a separate trace-payload audit, not by cookie consent.
  tracesSampleRate: 0,
  beforeSendTransaction: () => null,
  enableLogs: false,
  beforeSend: privateErrorReport,
};
