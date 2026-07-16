import { Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { reportLovableError } from "./lovable-error-reporting";

/**
 * Router-level fallbacks. TanStack Router uses these when a route does not
 * declare its own `errorComponent` / `notFoundComponent`. Keeping them here
 * (not in __root.tsx) avoids circular imports and lets any route reuse them.
 */

export function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_default_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-foreground">Something broke.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error?.message ? error.message : "An unexpected error occurred. Try again in a moment."}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground"
          >
            Try again
          </button>
          <Link
            to="/"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export function DefaultNotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-6xl text-foreground">404</h1>
        <p className="mt-3 text-muted-foreground">We couldn&apos;t find what you were looking for.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
