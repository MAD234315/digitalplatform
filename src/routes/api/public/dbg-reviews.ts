import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/dbg-reviews")({
  server: {
    handlers: {
      GET: async () => {
        const url =
          "https://docs.google.com/spreadsheets/d/1uzZSPtt036ULOqy2AYj9vyc6RppmUCzndF9TjqdO_z0/export?format=csv";
        const res = await fetch(url);
        const text = await res.text();
        const idx = text.indexOf("Yash jain");
        return Response.json({
          status: res.status,
          ct: res.headers.get("content-type"),
          len: text.length,
          head: text.slice(0, 400),
          yash: idx >= 0 ? text.slice(idx - 40, idx + 300) : null,
        });
      },
    },
  },
});
