import { createFileRoute } from "@tanstack/react-router";
import { getSheetReviews } from "@/lib/sheet-reviews.functions";

export const Route = createFileRoute("/api/public/dbg-reviews")({
  server: {
    handlers: {
      GET: async () => {
        const p = await getSheetReviews();
        return Response.json(p.reviews.slice(0, 6).map((r) => ({ n: r.name, liked: r.liked })));
      },
    },
  },
});
