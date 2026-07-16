/**
 * Bridge from our React error boundaries to Lovable's in-editor error console.
 *
 * The preview host injects `window.__lovableEvents.captureException` at runtime;
 * calling it forwards a caught error (plus route context) to the Lovable
 * dashboard so developers can see it without opening devtools. Safe to call in
 * any environment — no-ops on the server and when the host isn't present.
 */

type LovableErrorOptions = {

  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type LovableEvents = {
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: LovableErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
  }
}

/**
 * Report an error to Lovable's preview console. Extra keys in `context` are
 * merged into the payload (e.g. `{ boundary: "route" }`); route pathname is
 * added automatically.
 */
export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {

  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );
}
