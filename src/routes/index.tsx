import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteNav } from "@/components/site-chrome";
import { HeroSection } from "@/components/home/HeroSection";
import { WhoWeAreSection } from "@/components/home/WhoWeAreSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { ReasonsSection } from "@/components/home/ReasonsSection";
import { MottoPromiseSection } from "@/components/home/MottoPromiseSection";
import { ContactPromptSection } from "@/components/home/ContactPromptSection";

export const Route = createFileRoute("/")({
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
