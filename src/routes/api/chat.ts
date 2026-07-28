import { createFileRoute } from "@tanstack/react-router";
import type { UIMessage } from "ai";

const DIFY_BASE_URL = "https://api.dify.ai/v1";

function textOf(message: UIMessage): string {
  return (message.parts ?? [])
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

/** Dify has no message array input, so prior turns are folded into the query. */
function buildQuery(messages: UIMessage[]): string {
  const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === "user");
  if (lastUserIndex === -1) return "";
  const index = messages.length - 1 - lastUserIndex;
  const current = textOf(messages[index]);

  const history = messages
    .slice(0, index)
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-10)
    .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${textOf(m)}`)
    .filter((line) => line.length > 12);

  if (!history.length) return current;
  return `Previous conversation:\n${history.join("\n")}\n\nCustomer: ${current}`;
}

function sse(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.DIFY_API_KEY;
        if (!key) return new Response("AI is not configured", { status: 500 });

        const query = buildQuery(messages as UIMessage[]);
        if (!query) return new Response("Messages are required", { status: 400 });

        const upstream = await fetch(`${DIFY_BASE_URL}/chat-messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: {},
            query,
            response_mode: "streaming",
            user: "website-visitor",
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          return new Response(
            detail || "The assistant is unavailable right now.",
            { status: upstream.status || 502 },
          );
        }

        const messageId = crypto.randomUUID();
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const reader = upstream.body.getReader();

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const send = (data: unknown) => controller.enqueue(encoder.encode(sse(data)));
            send({ type: "start" });
            send({ type: "text-start", id: messageId });

            let buffer = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";

                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const payload = trimmed.slice(5).trim();
                  if (!payload || payload === "[DONE]") continue;

                  let event: { event?: string; answer?: string; message?: string };
                  try {
                    event = JSON.parse(payload);
                  } catch {
                    continue;
                  }

                  if (
                    (event.event === "message" || event.event === "agent_message") &&
                    event.answer
                  ) {
                    send({ type: "text-delta", id: messageId, delta: event.answer });
                  }
                  if (event.event === "error") {
                    send({
                      type: "text-delta",
                      id: messageId,
                      delta: event.message ?? "Something went wrong.",
                    });
                  }
                }
              }
            } catch {
              // fall through and close cleanly
            }

            send({ type: "text-end", id: messageId });
            send({ type: "finish" });
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
          cancel(reason) {
            return reader.cancel(reason);
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "x-vercel-ai-ui-message-stream": "v1",
          },
        });
      },
    },
  },
});
