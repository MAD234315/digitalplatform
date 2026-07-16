## Make the products search feel premium and always appear

The dropdown already renders matches (verified: typing "Can" returns Canva Pro, Canva AI Pro Brandkit), so the fix is UX polish that makes it obvious and premium, and hardening against the "it doesn't appear" case.

### Scope

All changes in `src/components/products/products-filter-bar.tsx`. No logic changes to `use-products-filter.ts` or product data.

### Changes

1. **Show suggestions on focus, before typing.**
   Currently `showList` requires ≥1 typed char. When the input is focused with an empty query, render a "Popular" section from the top 6 in-stock products (fallback: first 6 products). Header row inside the listbox: small uppercase label "Popular". Once the user types, switch to ranked matches (existing behavior).

2. **Premium row layout.** Replace the current single-line row with a two-line row per suggestion:
   - Left: 32×32 rounded product visual (reuse `getProductVisual` from `@/lib/product-visuals` — already used by `product-card.tsx`).
   - Middle: product name (highlighted match) on top, small muted `category · plan` line below.
   - Right: a tiny stock dot (green/amber/red matching `--whatsapp`/`--amber`/`--danger`) + one-word status ("In stock" / "Low" / "Out"), matching the stock chip color language already in the bar.

3. **Bigger, more prominent dropdown.**
   - Widen to full row (already full width after the previous change), increase `max-h` from `80` to `96`, add slight `mt` and stronger `shadow-xl`, `ring-1 ring-black/5` for lift.
   - Raise `z-40` to `z-50` so it always sits above cards.
   - Add subtle divider between rows; hover/active row uses `bg-muted`.

4. **Empty state.** If user typed ≥2 chars and there are no matches, render a single row: "No products match '<query>'. Try a shorter term." (non-clickable). Fixes the "feels broken" perception when the input silently shows nothing.

5. **Keyboard + a11y unchanged.** Keep existing `role="combobox"`, `aria-activedescendant`, arrow/Enter/Escape handling. Popular items and empty state get valid option ids so keyboard nav still works.

6. **Small robustness fixes.**
   - Open dropdown on focus even for empty query.
   - Close on route change / when a category or stock chip is clicked (call `setOpen(false)` inside those handlers via a small effect that watches `active`/`stock`).

### Out of scope

- No fuzzy/typo matching (current substring ranking stays).
- No changes to the FAQ FilterBar or shared filter logic.
- No new data fetching.