import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { HeroSection } from "@/components/home/HeroSection";
import { WhoWeAreSection } from "@/components/home/WhoWeAreSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { ReasonsSection } from "@/components/home/ReasonsSection";
import { MottoPromiseSection } from "@/components/home/MottoPromiseSection";
import { ContactPromptSection } from "@/components/home/ContactPromptSection";
import { ErrorBoundary } from "@/components/error-boundary";
import { OG_IMAGE, SITE_URL } from "@/lib/site-config";

const URL = SITE_URL + "/";
const TITLE = "Digital Platform — Premium Digital Subscriptions & AI Tools";
const DESC = "Trusted digital marketplace since 2020. 200+ premium subscriptions, AI tools, software licenses and gift cards — updated daily, priced honestly, supported by humans.";

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
      { property: "og:image:alt", content: "Digital Platform — premium digital marketplace" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: OG_IMAGE },
      { name: "twitter:image:alt", content: "Digital Platform — premium digital marketplace" },
    ],
    links: [{ rel: "canonical", href: URL }],
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
      <SiteNav />
      <main id="main">
        <ErrorBoundary boundary="home:hero"><HeroSection /></ErrorBoundary>
        <ErrorBoundary boundary="home:who-we-are"><WhoWeAreSection /></ErrorBoundary>
        <ErrorBoundary boundary="home:categories"><CategoriesSection /></ErrorBoundary>
        <ErrorBoundary boundary="home:reasons"><ReasonsSection /></ErrorBoundary>
        <ErrorBoundary boundary="home:motto"><MottoPromiseSection /></ErrorBoundary>
        <ErrorBoundary boundary="home:contact-prompt"><ContactPromptSection /></ErrorBoundary>
      </main>
      <SiteFooter />
    </div>
  );
}
