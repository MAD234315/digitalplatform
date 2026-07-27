import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";

export const Route = createFileRoute("/api/test-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: unknown };
        const converted = Array.isArray(messages)
          ? await convertToModelMessages(messages as UIMessage[])
          : [];
        return new Response(
          JSON.stringify({
            receivedMessages: messages,
            receivedCount: Array.isArray(messages) ? messages.length : null,
            converted,
            convertedCount: converted.length,
          }, null, 2),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});
