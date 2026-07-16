# Refactor & Optimization Plan

A phased pass across code structure, performance, accessibility, and SEO. Each phase is independently shippable — stop at any phase once you're satisfied.

## Phase 1 — Code hygiene (low risk, quick wins)

1. **Delete dead code**
   - Remove unused `.theme-paper { … }` rule from `src/styles.css` (no consumer since light theme moved to `:root.light`).
   - Remove the `:root[data-reduce-motion="true"]` block from `src/styles.css` — the manual toggle was removed; `prefers-reduced-motion` still handles this via the media query.
2. **Consolidate motion utilities**
   - `src/lib/motion-preference.ts` and the `useReducedMotion` logic inside `src/components/reveal.tsx` and `src/components/tilt-card.tsx` overlap. Export one `useReducedMotion()` hook from `motion-preference.ts` and consume it in both components.
3. **Split `src/routes/faq.tsx` (278 lines)**
   - Extract the FAQ item array to `src/components/faq/data.ts`, and the accordion item component to `src/components/faq/FaqItem.tsx`. Keeps the route file to routing + `<head>` + composition.
4. **Split `src/routes/products.tsx` (247 lines)**
   - Move the filter/sort state machinery into `src/components/products/use-products-filter.ts` (hook). The route file should orchestrate: loader → hook → `<ProductsHero />` + `<ProductsFilterBar />` + grid.

## Phase 2 — Performance

1. **Image pipeline**
   - Add `vite-imagetools` and switch `product-visuals.ts` + hero art to `?format=avif&format=webp&as=picture` variants. Serve via `<picture>` with `<source type="image/avif">` fallbacks. Set explicit `width`/`height` and `loading="lazy"` on non-LCP images, `fetchpriority="high"` on the hero.
2. **Preload the LCP image**
   - In `src/routes/index.tsx`, add `head().links` entry: `{ rel: 'preload', as: 'image', href: heroWebp, fetchpriority: 'high' }`.
3. **Data caching for products**
   - `sheet-products.functions.ts` is called per navigation. Cache via TanStack Query `queryOptions({ queryKey: ['sheet-products'], queryFn, staleTime: 5 * 60_000 })` and use `context.queryClient.ensureQueryData` in the products loader + `useSuspenseQuery` in the component.
4. **Route-level code splitting audit**
   - Verify `products.tsx`, `faq.tsx`, and `contact.tsx` aren't imported statically from the root. TanStack file-based routing splits per file automatically — confirm no cross-imports pull them into the root bundle.
5. **Reveal / tilt performance**
   - Coalesce all `Reveal` observers into one shared `IntersectionObserver` instance (module-level singleton with a Map of element → callback). Currently each `Reveal` creates its own observer; on the home page there are 20+.
6. **Font loading**
   - In `__root.tsx`, ensure the Google Fonts `<link>` uses `rel="preconnect"` for `fonts.gstatic.com` (crossorigin) plus `rel="preload" as="style"` for the CSS, and `font-display: swap` on the request URL.

## Phase 3 — Accessibility

1. **Landmarks & headings**
   - Verify exactly one `<main>` per route (in `__root.tsx` or each leaf). Ensure H1 → H2 → H3 order per page; no skipped levels.
2. **Icon-only buttons**
   - Audit `theme-toggle.tsx`, `site-chrome.tsx` mobile menu button, product-card share/wa buttons — every icon-only `<Button size="icon">` must have `aria-label`.
3. **Focus states**
   - Confirm `:focus-visible` outline on every interactive element (button, link, input, accordion trigger). Add a global `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` fallback in `styles.css` for anything missed.
4. **Color contrast**
   - Replace any `text-muted-foreground/50` or `/60` usage with plain `text-muted-foreground` where it acts as body copy (still often below AA at 50 %).
5. **Reduced motion**
   - `Reveal` and `TiltCard` already respect `prefers-reduced-motion`. Add the same short-circuit to `CountUp` (`src/components/count-up.tsx`) so it snaps to the final value instead of animating.
6. **Form a11y (contact page)**
   - Ensure every input has an associated `<Label htmlFor>`, `aria-invalid` toggles on error, and error text is linked via `aria-describedby`.

## Phase 4 — SEO & metadata

1. Per-route `head()` audit — confirm unique `title` (< 60 chars), `description` (< 160), matching `og:title`/`og:description`, `twitter:card="summary_large_image"`.
2. Add `og:image` at leaf routes that have a real hero (home, products) — absolute HTTPS URL. Omit elsewhere.
3. Add JSON-LD `Organization` on `/` and `Product` on product detail cards (if applicable) via the route's `head().scripts`.
4. Confirm `sitemap[.]xml.ts` includes every current route and a `lastmod`.

## Phase 5 — Verification

1. `bunx tsgo --noEmit` — clean typecheck.
2. Playwright pass: home + products + faq at 375 × 812 and 1280 × 800; screenshot every route in light + dark; assert no console errors.
3. Lighthouse (or manual PSI) target: Performance ≥ 90 mobile, Accessibility ≥ 95, SEO = 100. Record before/after in the PR description.
4. Axe pass via `@axe-core/playwright`: zero critical, zero serious findings.

## Technical notes

- Order matters only across phases 1 → 2 → 3; within a phase, items are independent and can land in separate commits.
- No schema, no auth, no backend changes are required — this is a frontend-only refactor.
- Phase 2.5 (shared IntersectionObserver) and 2.3 (query caching) give the biggest measurable wins; do those first if time-boxed.
