import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { HeroSection } from "@/components/home/HeroSection";
import { WhoWeAreSection } from "@/components/home/WhoWeAreSection";
import { StatsCounterSection } from "@/components/home/StatsCounterSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { ReasonsSection } from "@/components/home/ReasonsSection";
import { MottoPromiseSection } from "@/components/home/MottoPromiseSection";
import { ContactPromptSection } from "@/components/home/ContactPromptSection";
import { ErrorBoundary } from "@/components/error-boundary";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { OG_IMAGE, ORG_ID, SITE_URL, WEBSITE_ID } from "@/lib/site-config";

const URL = SITE_URL + "/";
const TITLE = "Digital Platform — Premium Digital Subscriptions & AI Tools";
const DESC = "Trusted digital store since 2020. 200+ premium subscriptions, AI tools, software licenses & gift cards — our prices and plans change based on demand and availability.";

/** Home-page structured data: WebPage tying together Organization + WebSite. */
const HOME_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": URL + "#webpage",
  url: URL,
  name: TITLE,
  description: DESC,
  isPartOf: { "@id": WEBSITE_ID },
  about: { "@id": ORG_ID },
  primaryImageOfPage: {
    "@type": "ImageObject",
    url: OG_IMAGE,
    width: 1200,
    height: 630,
  },
  inLanguage: "en",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { property: "og:image", content: OG_IMAGE },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Digital Platform — premium digital products and AI tools" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:image:alt", content: "Digital Platform — premium digital products and AI tools" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(HOME_JSON_LD),
      },
    ],
  }),
  component: Home,
});

function Home() {
  // Each section is wrapped in its own boundary so a runtime failure in one
  // (bad data, DOM/intersection API misuse, etc.) degrades that panel only —
  // the rest of the landing page keeps rendering. TanStack's route-level
  // errorComponent still catches anything that escapes here.
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <ErrorBoundary boundary="shell:nav" fallback={null}><SiteNav /></ErrorBoundary>
      <main id="main">
        <ErrorBoundary boundary="home:hero"><HeroSection /></ErrorBoundary>
        <ErrorBoundary boundary="home:who-we-are"><div className="cv-auto"><WhoWeAreSection /></div></ErrorBoundary>
        <ErrorBoundary boundary="home:stats"><div className="cv-auto"><StatsCounterSection /></div></ErrorBoundary>
        <ErrorBoundary boundary="home:categories"><div className="cv-auto"><CategoriesSection /></div></ErrorBoundary>
        <ErrorBoundary boundary="home:reasons"><div className="cv-auto"><ReasonsSection /></div></ErrorBoundary>
        <ErrorBoundary boundary="home:motto"><div className="cv-auto"><MottoPromiseSection /></div></ErrorBoundary>
        <ErrorBoundary boundary="home:contact-prompt"><div className="cv-auto"><ContactPromptSection /></div></ErrorBoundary>

      </main>
      <ErrorBoundary boundary="shell:footer" fallback={null}><SiteFooter /></ErrorBoundary>
      <ErrorBoundary boundary="shell:wa-fab" fallback={null}><WhatsAppFab prefill="Hi Digital Platform! I found you via your website and I'd like to know more about your products and pricing." /></ErrorBoundary>
    </div>
  );
}
