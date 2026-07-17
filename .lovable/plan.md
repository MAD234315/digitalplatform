## Goal
A cohesive polish across every route without breaking the existing Noir & Gold identity. Moderate boldness (3/5): tighten hierarchy, motion, spacing, and semantics — no palette or typography swap.

## Scope
All pages (`index`, `about`, `contact`, `products`, `product-request`, `faq`, `privacy`, `terms`, `refund`) plus shared chrome (`site-chrome.tsx`, `PageHero`, `PageShell`, `WhatsAppFab`) and home sections.

## Work in four passes

### 1. Accessibility
- Add `aria-label` to every icon-only button/link (theme toggle, WhatsApp FAB, social links, mobile menu trigger).
- Ensure a single `<main>` per route (in `__root.tsx` around `<Outlet />`, remove any nested `<main>`).
- Add skip-to-content link in root layout.
- Convert clickable `div`/`span` handlers to `<button>`; give the mobile nav proper `aria-expanded` / `aria-controls`.
- Set `lang="en"` on `<html>` and verify heading order per route (one `h1`, then `h2` → `h3`).
- Bump `size="icon"` primary tap targets to `min-h-11 min-w-11`; verify focus-visible ring on all interactive elements uses `--ring` gold.
- Replace low-contrast `text-muted-foreground/50` occurrences with token defaults.
- Add `alt=""` to decorative images; meaningful alt to content images.

### 2. Responsive layout
- Header row: rewrite as `grid-cols-[minmax(0,1fr)_auto] sm:flex` with `min-w-0` on brand block and `shrink-0` on nav actions.
- Footer columns: stack cleanly on mobile, `sm:grid-cols-2 lg:grid-cols-4`, remove overflow.
- Swap any `h-screen` for `h-dvh` in hero-height sections.
- Constrain long headings with `text-balance`; body paragraphs with `text-pretty` and `max-w-prose`.
- Tighten section paddings on mobile (`py-16 lg:py-24` instead of `py-20 lg:py-32` where content is short).

### 3. Modern visuals
- Add subtle motion polish: keep `Reveal`, add `motion-safe:` guards and honor `prefers-reduced-motion` in `styles.css`.
- Unify card hover: `hover:border-amber/40 hover:shadow-gold` used consistently across product/reason/promise cards.
- Introduce a shared `Section` primitive with consistent eyebrow + heading + lede rhythm so pages feel like one system.
- Refine footer "Legal" column: proper `<nav aria-label="Legal">`, `<h2>` visually styled as eyebrow, tighter link list with focus states.
- Sharpen headline gradient (already defined) and apply consistently to page H1s.

### 4. Performance / cleanup
- Remove dead `import`s and unused variants surfaced by ESLint.
- Collapse duplicated hero markup between `HeroSection` and `PageHero` where possible.
- Add `loading="lazy"` and `decoding="async"` to below-the-fold images; `fetchpriority="high"` on the home hero image.
- Ensure every route `head()` sets a unique `title` and `description` (audit and fix any placeholders).

## Non-goals
- No palette, font, or brand voice changes.
- No new pages or features.
- No backend or data changes.

## Verification
After edits: run typecheck, ESLint, and open each route via Playwright at mobile (390px) and desktop (1280px) to screenshot and confirm no regressions.
