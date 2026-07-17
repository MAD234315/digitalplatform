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

import appCss from "../styles.css?inline";
import dmSerif400Woff2 from "@fontsource/dm-serif-display/files/dm-serif-display-latin-400-normal.woff2?url";
import firaSans400Woff2 from "@fontsource/fira-sans/files/fira-sans-latin-400-normal.woff2?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { installClientErrorListeners } from "../lib/client-error-listeners";
import { ORG_ID, SITE_URL, WEBSITE_ID } from "../lib/site-config";

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
      { name: "description", content: "Trusted digital marketplace since 2020. Premium subscriptions, AI tools, software licenses and gift cards — priced honestly." },
      { name: "author", content: "Digital Platform" },
      { name: "color-scheme", content: "dark light" },
      { name: "theme-color", content: "#f8f2e4", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#0d0d0d", media: "(prefers-color-scheme: dark)" },
      { property: "og:site_name", content: "Digital Platform" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@digitalplatform" },
    ],

    links: [
      { rel: "preload", as: "font", type: "font/woff2", href: dmSerif400Woff2, crossOrigin: "anonymous" },
    ],




    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": ORG_ID,
              name: "Digital Platform",
              url: SITE_URL,
              foundingDate: "2020",
              description:
                "Trusted marketplace for premium digital subscriptions, AI tools, software licenses and gift cards.",
              logo: {
                "@type": "ImageObject",
                url: `${SITE_URL}/favicon.ico`,
              },
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  telephone: "+91-96521-91369",
                  email: "Productcreator11@zohomail.in",
                  availableLanguage: ["en", "hi"],
                  areaServed: "IN",
                  hoursAvailable: {
                    "@type": "OpeningHoursSpecification",
                    dayOfWeek: [
                      "Monday", "Tuesday", "Wednesday", "Thursday",
                      "Friday", "Saturday", "Sunday",
                    ],
                    opens: "10:00",
                    closes: "22:00",
                  },
                },
              ],
              sameAs: ["https://wa.me/919652191369"],
            },
            {
              "@type": "WebSite",
              "@id": WEBSITE_ID,
              url: SITE_URL,
              name: "Digital Platform",
              publisher: { "@id": ORG_ID },
              inLanguage: "en",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
                },
                "query-input": "required name=search_term_string",
              },
            },
          ],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|;\\s*)dp-theme=(light|dark)/);var s=m&&m[1];var t=(s==='light'||s==='dark')?s:'dark';var r=document.documentElement;if(t==='light')r.classList.add('light');r.style.colorScheme=t;}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  // suppressHydrationWarning on <html>: the pre-hydration script above
  // mutates documentElement.className and .style before React attaches,
  // so the SSR markup ("<html lang=en>") will differ from the live DOM
  // ("<html lang=en class=light style=color-scheme:light>"). That's the
  // one node we intentionally desync — silence the warning here only.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: appCss }} />
        <HeadContent />
      </head>
      <body>{children}<Scripts /></body>
    </html>
  );
}



function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // One-shot: attach window.onerror + unhandledrejection listeners on the
  // client so anything that escapes React boundaries still gets reported.
  useEffect(() => { installClientErrorListeners(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
