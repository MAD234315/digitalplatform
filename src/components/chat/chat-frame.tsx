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
  { label: "More offers", prompt: "Show me more offers and bundles I might have missed." },
  { label: "Gift cards", prompt: "Which gift cards do you sell and how are they delivered?" },
  { label: "Delivery time", prompt: "How fast is delivery after I pay?" },
  { label: "Warranty", prompt: "What warranty do you offer and how does it work?" },
  { label: "How to order", prompt: "How do I place an order?" },
];

export const CHAT_SUGGESTIONS = CHAT_QUICK_PROMPTS.slice(0, 4).map((q) => q.prompt);

export function ChatFrame({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <section className="flex min-h-[calc(100dvh-64px-1px)] items-center justify-center bg-background px-3 py-4 sm:px-4 sm:py-6 lg:px-8 lg:py-10">
        {children}
      </section>
    </PageShell>
  );
}
