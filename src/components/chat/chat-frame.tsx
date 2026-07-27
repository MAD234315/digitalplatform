import { PageShell } from "@/components/layout/PageShell";
import { PageHero } from "@/components/layout/PageHero";
import { SITE_URL } from "@/lib/site-config";

export const CHAT_URL = SITE_URL + "/chat";
export const CHAT_TITLE = "Ask Digital Platform — AI catalogue & support assistant";
export const CHAT_DESC =
  "Chat with the Digital Platform assistant about subscriptions, AI tools, delivery, warranty and pricing — then finish your order on WhatsApp.";

export const CHAT_SUGGESTIONS = [
  "What AI tools do you have in stock?",
  "How fast is delivery?",
  "Do you offer a warranty?",
  "How do I place an order?",
];

export function ChatFrame({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <PageHero
        compact
        eyebrow="AI assistant"
        title="Ask us"
        titleAccent="anything."
        lede="Our assistant knows the live catalogue, delivery times, warranty and support hours. Your conversations are saved so you can pick up where you left off."
      />
      <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">{children}</section>
    </PageShell>
  );
}
