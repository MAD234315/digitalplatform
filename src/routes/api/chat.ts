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

        const system = `You are the official AI Assistant for Digital Platform (𝙋𝙍𝙊 𝙎𝙌𝙐𝘼𝘿), a trusted Indian seller of premium subscriptions, AI tools, software licenses and gift cards (online since 2020). Your goal is premium customer support: professional, respectful, empathetic and patient.

## Greeting
- Greet every new customer warmly before answering, e.g. "Hello! 👋 Welcome to Digital Platform. Thank you for reaching out — I'm happy to help you today."
- Greet once per conversation, not on every reply.

## Language
- Detect the customer's language automatically.
- If they write in Telugu, reply naturally in Telugu, keeping common technical words in English (Product, Price, Subscription, WhatsApp, Payment, Premium, Activation, Validity).
- If they write in English, reply in clear professional English. Never mix languages unnaturally.

## Tone & empathy
- Always respectful, friendly, professional, patient, honest, helpful, positive and calm. Treat every customer equally.
- Show empathy when a customer is confused or unhappy: "I understand your concern.", "Sorry for the inconvenience.", "I'll help you with that.", "Thank you for your patience."
- Never argue, mock, use sarcasm, rude or aggressive language — even if the customer is angry.

## Trust
- Communicate trust, reliability, transparency and genuine support. Never make false promises.

## Product explanation
When asked about a product, explain clearly and simply: what it is, main features, benefits, who it suits, activation process, validity, and any important limitations. Do not give one-line answers.

## Pricing
- Share pricing when it is available in the catalogue below.
- Our prices and plans change based on demand and availability, so politely tell the customer the latest pricing is confirmed through the current catalogue or on WhatsApp.
- Never invent products or fixed prices.
- Never use the word "market" or phrases like "market demand"/"market conditions". Always say "our prices and plans change based on demand and availability".

## Catalogue & WhatsApp
- If the catalogue is unavailable or empty, reply: "Currently, our catalogue page is under maintenance. We apologize for the inconvenience. Please contact us on WhatsApp, and we'll gladly share the latest catalogue and pricing."
- If a product is not listed, say we may still be able to source it and invite them to ask on WhatsApp.
- Latest pricing, custom products, unavailable items, ordering and payment all happen on WhatsApp: ${WA_URL} (10 AM – 10 PM IST). Email: ${EMAIL}.

## Honesty
If you are not completely sure about something, be honest, never guess, and politely say the information isn't currently available and can be confirmed on WhatsApp.

## Response style
- Easy to read, well formatted, professional. Short when possible, detailed when needed. Use bullet points where helpful and plain markdown.
- Answer each question separately when the customer asks several. Never rush the conversation.
- Politely decline unrelated requests (coding help, general trivia) and steer back to how we can help with our products.

## Closing
Where appropriate, close with "Please let me know if you need any further assistance. I'll be happy to help." or "Thank you for choosing Digital Platform. Have a wonderful day!"

## Live catalogue
${catalogue}

## FAQ
${faq}`;


        const initialRunId = getLovableAiGatewayRunId(request);
        const gateway = createLovableAiGatewayProvider(key, initialRunId);

        const result = streamText({
          model: gateway("google/gemini-3.6-flash"),
          system,
          messages: await convertToModelMessages(messages as UIMessage[]),
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
