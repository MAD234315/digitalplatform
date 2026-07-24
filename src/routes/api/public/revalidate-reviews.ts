import { createFileRoute } from "@tanstack/react-router";
import { revalidateReviewsCache } from "@/lib/sheet-reviews.functions";

// Public webhook endpoint. Hit this from a Google Apps Script "on form
// submit" trigger (or any external tool) to instantly bust the reviews
// server cache so the next page load shows the new review.
//
// Example (Apps Script):
//   UrlFetchApp.fetch("https://digitalplatform.lovable.app/api/public/revalidate-reviews", { method: "post" });

const handle = () => {
  revalidateReviewsCache();
  return Response.json({ ok: true, revalidatedAt: new Date().toISOString() });
};

export const Route = createFileRoute("/api/public/revalidate-reviews")({
  server: {
    handlers: {
      GET: handle,
      POST: handle,
    },
  },
});
