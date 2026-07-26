import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/dbg-reviews")({
  server: {
    handlers: {
      GET: async () => {
        const url =
          "https://docs.google.com/spreadsheets/d/1uzZSPtt036ULOqy2AYj9vyc6RppmUCzndF9TjqdO_z0/export?format=csv";
        const res = await fetch(url, { cache: "no-store" });
        const text = await res.text();
        const firstLine = text.split("\n")[0];
        return Response.json({
          len: text.length,
          header: firstLine
            .split(",")
            .map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, "")),
        });
      },
    },
  },
});
