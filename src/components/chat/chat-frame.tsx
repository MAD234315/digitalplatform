import { PageShell } from "@/components/layout/PageShell";
import { SITE_URL } from "@/lib/site-config";

export const CHAT_URL = SITE_URL + "/chat";
export const CHAT_TITLE = "Ask CREATOR AI — AI catalogue & support assistant";
export const CHAT_DESC =
  "Chat with CREATOR AI about subscriptions, AI tools, delivery, warranty and pricing — then finish your order on WhatsApp.";

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

export function ChatFrame({ children }: { children: React.ReactNode }) {
  return (
    <PageShell>
      <section className="flex items-stretch justify-center overflow-x-hidden bg-background px-0 pt-16 sm:px-4 sm:pb-6 sm:pt-24 lg:px-8">
        {children}
      </section>
    </PageShell>
  );
}
