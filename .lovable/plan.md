## Current behavior (already implemented last turn)

`src/components/products/use-products-filter.ts` tracks a per-product content fingerprint in `localStorage` (`products-first-seen-v4`):

- **Added** — a product key never seen before is stamped with `now` and appears in Latest for 7 days.
- **Edited** — when any tracked field (status, validity, plan, type, supports, warranty, availability, badges) changes vs. the stored fingerprint, the timestamp is reset to `now` and the item jumps back to the top of Latest for another 7 days.
- **Sort** — Latest is sorted by `updatedAt DESC`, tie-broken by original catalogue order.
- **Expiry** — after 7 days without further edits, the item drops out of Latest but stays in the main catalogue.

So any edit made in the Google Sheet (the product source) or a newly-added row will surface in Latest on the next page load.

## Gap this plan closes

The current tracker only reacts to a limited set of fields. If you edit **name**, **category**, **description**, **image**, or **price/detail text** in the sheet, the fingerprint does not change and Latest does not update.

## Plan

1. **Expand the edit signal** in `signatureOf()` to include every user-visible field on `SheetProduct` (name, category, description, price, image URL, etc.), so any sheet edit — not just status/badges — moves the row to the top of Latest.
2. **Bump `SEEN_KEY`** to `products-first-seen-v5` so existing browsers rebuild the fingerprint map cleanly with the new field set (one-time reset; visible products get re-stamped as "just seen" per the current first-sight rule).
3. **Verify on `/products`** by toggling the Latest pill: the count should equal recently-seen + recently-edited items, and the most recently changed product should be first.

No schema or admin-panel changes are needed — the product catalogue is sourced from the Google Sheet, and edits there already flow through this tracker.