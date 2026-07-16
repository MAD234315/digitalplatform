/**
 * Out-of-band error capture for the SSR entry.
 *
 * When TanStack Start / h3 catches an unhandled throw during SSR, it turns
 * the error into a plain 500 Response and the original stack is lost. This
 * module attaches global `error` and `unhandledrejection` listeners on the
 * worker's `globalThis`, records the most recent error with a short TTL,
 * and hands it back to `server.ts` via {@link consumeLastCapturedError}
 * so we can log and report the real cause.
 */


let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
