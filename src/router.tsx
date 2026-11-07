import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { DefaultErrorComponent, DefaultNotFoundComponent } from "./lib/default-error-boundaries";
import { DefaultPendingComponent } from "./lib/default-pending";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Show cached data instantly on revisit; refetch in background.
        staleTime: 60_000,
        gcTime: 30 * 60_000,
        retry: 1,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Animate only catalogue/detail navigation, including native history back.
    defaultViewTransition: {
      types: ({ fromLocation, toLocation }) => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
        const from = fromLocation?.pathname ?? "";
        const to = toLocation.pathname;
        if (to.startsWith("/product/") && from === "/products") return ["product-open"];
        if (from.startsWith("/product/") && to === "/products") return ["product-back"];
        return false;
      },
    },
    // Preload route code + data on hover/focus so intra-site nav feels instant.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    // Show a pending fallback immediately instead of the old page appearing
    // frozen while the new route's loader resolves.
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultPendingComponent: DefaultPendingComponent,
    defaultErrorComponent: DefaultErrorComponent,
    defaultNotFoundComponent: DefaultNotFoundComponent,
  });

  return router;
};
