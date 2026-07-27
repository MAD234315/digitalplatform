import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  createLovableAiGatewayProvider,
  getLovableAiGatewayResponseHeaders,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";
import { getSheetProducts } from "@/lib/sheet-products.functions";
import { FAQS } from "@/components/faq/data";

const WA_URL = "https://wa.me/919652191369";
const EMAIL = "Productcreator11@zohomail.in";

/** Compact catalogue snapshot the model can reason over (kept small on purpose). */
async function catalogueContext(): Promise<string> {
  try {
    const payload = await getSheetProducts();
    if (payload.maintenance) return "The catalogue is temporarily offline for maintenance.";
    if (!payload.products.length) return "The catalogue could not be loaded right now.";

    const byCategory = new Map<string, string[]>();
    for (const p of payload.products) {
      const line = [
        p.name,
        p.plan && `plan: ${p.plan}`,
        p.validity && `validity: ${p.validity}`,
        p.warranty && `warranty: ${p.warranty}`,
        `status: ${p.availability}`,
      ]
        .filter(Boolean)
        .join(" | ");
      const list = byCategory.get(p.category) ?? [];
      list.push(line);
      byCategory.set(p.category, list);
    }

    return [...byCategory.entries()]
      .map(([cat, lines]) => `### ${cat}\n${lines.join("\n")}`)
      .join("\n\n");
  } catch {
    return "The catalogue could not be loaded right now.";
  }
}

function faqContext(): string {
  return FAQS.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n\n");
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("AI is not configured", { status: 500 });

        const [catalogue, faq] = [await catalogueContext(), faqContext()];

        const system = `You are the Digital Platform assistant — a friendly, concise support agent for a trusted Indian digital marketplace selling premium subscriptions, AI tools, software licenses and gift cards (online since 2020).

Rules:
- Answer only about Digital Platform: our catalogue, pricing guidance, delivery, warranty, refunds, support, and how to order.
- Never invent products or fixed prices. Prices depend on live stock and demand — tell the customer to confirm today's rate on WhatsApp.
- If a product is not in the catalogue below, say we may still be able to source it and suggest asking on WhatsApp.
- Ordering and payment always happen over WhatsApp: ${WA_URL} (10 AM – 10 PM IST). Email: ${EMAIL}.
- Keep answers short (2–5 sentences or a tight bullet list). Use plain markdown. No emojis unless the user uses them.
- Politely decline unrelated requests (coding help, general trivia) and steer back to the catalogue.

## Live catalogue
${catalogue}

## FAQ
${faq}`;

        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(key, initialRunId);

        const result = streamText({
          model: gateway("google/gemini-3.6-flash"),
          system,
          messages: convertToModelMessages(messages as UIMessage[]),
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          headers: getLovableAiGatewayResponseHeaders(undefined, {
            ...(initialRunId ? { "X-Lovable-AIG-Run-ID": initialRunId } : {}),
          }),
        });

        return withLovableAiGatewayRunIdHeader(response, gateway);
      },
    },
  },
});
