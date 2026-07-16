import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl text-foreground">404</h1>
        <p className="mt-3 text-muted-foreground">This page has drifted off the shelf.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground">
          Back home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-foreground">Something broke.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Try again in a moment.</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-5 rounded-full bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Digital Platform — Premium apps & AI tools at prices that make sense" },
      { name: "description", content: "Trusted digital marketplace since 2020. premium subscriptions, AI tools, software licenses and gift cards — updated daily, priced honestly, supported by humans." },
      { name: "author", content: "Digital Platform" },
      { property: "og:title", content: "Digital Platform — Premium apps & AI tools at prices that make sense" },
      { property: "og:description", content: "Trusted digital marketplace since 2020. premium subscriptions, AI tools, software licenses and gift cards — updated daily, priced honestly, supported by humans." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Digital Platform — Premium apps & AI tools at prices that make sense" },
      { name: "twitter:description", content: "Trusted digital marketplace since 2020. premium subscriptions, AI tools, software licenses and gift cards — updated daily, priced honestly, supported by humans." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9020bb4c-4fbb-4a1f-952c-73595881f781/id-preview-e6e1751c--d4bb26a2-c52c-4106-b5f5-124547e11859.lovable.app-1784176439112.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9020bb4c-4fbb-4a1f-952c-73595881f781/id-preview-e6e1751c--d4bb26a2-c52c-4106-b5f5-124547e11859.lovable.app-1784176439112.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Work+Sans:wght@400;500;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
