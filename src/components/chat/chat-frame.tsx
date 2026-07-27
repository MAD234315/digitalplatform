import { PageShell } from "@/components/layout/PageShell";
import { SITE_URL } from "@/lib/site-config";

export const CHAT_URL = SITE_URL + "/chat";
export const CHAT_TITLE = "Ask Digital Platform — AI catalogue & support assistant";
export const CHAT_DESC =
  "Chat with the Digital Platform assistant about subscriptions, AI tools, delivery, warranty and pricing — then finish your order on WhatsApp.";

/** Quick prompts shown above the composer so a visitor can start in one tap. */
export const CHAT_QUICK_PROMPTS = [
  { label: "Latest offers", prompt: "What are your latest offers right now?" },
  { label: "AI tools", prompt: "Which AI tools do you have in stock?" },
  { label: "Subscriptions", prompt: "Which subscriptions do you sell?" },
  { label: "Product search", prompt: "Help me find a product from your catalogue." },
  { label: "Contact admin", prompt: "I would like to talk to the admin about an order." },
];

/** Suggested question chips under the welcome message. */
export const CHAT_SUGGESTION_CHIPS = [
  "Amazon Prime",
  "Netflix",
  "ChatGPT Plus",
  "Canva Pro",
  "Adobe",
  "Latest Offers",
  "Pricing",
];

export const CHAT_SUGGESTIONS = CHAT_QUICK_PROMPTS.slice(0, 4).map((q) => q.prompt);

export function ChatFrame({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <section className="flex items-stretch justify-center overflow-x-hidden bg-background px-0 pt-16 sm:px-4 sm:pb-6 sm:pt-24 lg:px-8">
        {children}
      </section>
    </PageShell>
  );
}
