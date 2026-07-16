/**
 * Install browser-side global error listeners once, on the client only.
 *
 * Complements the server-side capture in `src/lib/error-capture.ts` and the
 * React error boundaries (`ErrorBoundary`, root `errorComponent`) by catching
 * everything that escapes both — sync throws from event handlers, rejected
 * promises with no `.catch`, non-React library failures, etc. — and
 * forwarding them to Lovable's preview console with a stable mechanism tag so
 * they don't get double-reported by other layers.
 *
 * Idempotent: safe to call from multiple mount points; only the first call
 * attaches listeners.
 */
import { reportLovableError } from "./lovable-error-reporting";

let installed = false;

export function installClientErrorListeners() {
  if (installed) return;
  if (typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (event: ErrorEvent) => {
    const err = event.error ?? new Error(event.message || "Unknown window error");
    // eslint-disable-next-line no-console
    console.error("[window.onerror]", err);
    reportLovableError(err, {
      source: "window_onerror",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const err = reason instanceof Error ? reason : new Error(String(reason ?? "Unhandled rejection"));
    // eslint-disable-next-line no-console
    console.error("[unhandledrejection]", err);
    reportLovableError(err, { source: "unhandled_rejection" });
  });
}
