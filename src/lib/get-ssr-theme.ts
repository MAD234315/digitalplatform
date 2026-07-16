import { createIsomorphicFn } from "@tanstack/react-start";
import { readThemeCookie, type Theme } from "./use-theme";

/**
 * Read the persisted theme cookie during SSR. On the client we return
 * undefined and let the pre-hydration script / useTheme handle it — the
 * inline script has already applied the class to <html> before React runs.
 */
export const getSsrTheme: () => Theme | undefined = createIsomorphicFn()
  .client(() => undefined)
  .server(() => {
    // Lazy-load server-only helpers so this module stays client-safe.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getRequestHeader } = require("@tanstack/react-start/server") as {
        getRequestHeader: (name: string) => string | undefined;
      };
      return readThemeCookie(getRequestHeader("cookie"));
    } catch {
      return undefined;
    }
  });
