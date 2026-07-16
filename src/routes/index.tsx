import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { HeroSection } from "@/components/home/HeroSection";
import { WhoWeAreSection } from "@/components/home/WhoWeAreSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { ReasonsSection } from "@/components/home/ReasonsSection";
import { MottoPromiseSection } from "@/components/home/MottoPromiseSection";
import { ContactPromptSection } from "@/components/home/ContactPromptSection";

const SITE = "https://digitalplatform13.lovable.app";
const TITLE = "Digital Platform — Premium Digital Subscriptions & AI Tools";
const DESC = "Trusted digital marketplace since 2020. 200+ premium subscriptions, AI tools, software licenses and gift cards — updated daily, priced honestly, supported by humans.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:url", content: SITE + "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: SITE + "/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <SiteNav />
      <main id="main">
        <HeroSection />
        <WhoWeAreSection />
        <CategoriesSection />
        <ReasonsSection />
        <MottoPromiseSection />
        <ContactPromptSection />
      </main>
      <SiteFooter />
    </div>
  );
}
