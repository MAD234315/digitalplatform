# SEO plan — Digital Platform

A concrete, ordered plan to take the site from "technically indexable" to "ranking for buyer-intent queries." The site is a live catalogue of digital subscriptions on `https://digitalplatform13.lovable.app`. Semrush has no organic data on the domain yet (brand new in Google's index), so the priority is fixing on-page technicals **and** publishing enough long-tail content to earn first impressions.

## Phase 1 — Fix what the SEO scanner already flagged

Immediate, mechanical fixes from the latest scan.

1. **Trim meta descriptions to ≤160 chars** on `src/routes/index.tsx`, `src/routes/about.tsx`, and `src/routes/__root.tsx` (currently 169 / 165 / 163).
2. **Fix heading hierarchy on `/products`.** Product cards render `<h3>` under an `<h1>` with no `<h2>` in between. Add an `<h2>` above the grid (e.g. "Live catalogue") in `src/routes/products.tsx`.
3. **Add `public/llms.txt`** so AI assistants (ChatGPT, Perplexity, Claude) can index the site without parsing the JS shell. Include Home, Products, About, FAQ, Contact.

Verification: rerun the SEO scan; findings above should flip to *fixed*.

## Phase 2 — Search Console + baseline measurement

Without this, all later work is invisible.

1. Verify the domain in Google Search Console via a `META` verification token (add to `__root.tsx` head, deploy, call verify, then `PUT` the site into the property list).
2. Submit `sitemap.xml` from within the property.
3. Wait 3–7 days, then read the Search Console coverage & performance reports monthly.
4. (Optional) Bing Webmaster Tools — same sitemap, five-minute onboarding, non-trivial share of Indian traffic.

## Phase 3 — On-page depth for existing pages

The current pages are metadata-correct but content-thin for ranking. Expand where it matters.

1. **Products page (`/products`)** — the money page.
   - Add a top-of-page intro paragraph (~80–120 words) with anchor keywords: *premium digital subscriptions India*, *buy Netflix / Spotify / ChatGPT subscription*, *AI tool licenses*.
   - Group products under `<h2>` category headings that match the sheet (Streaming, AI Tools, Software, Gift Cards). Each `<h2>` gets a one-sentence description — real text, not a placeholder.
   - Product cards keep `<h3>` (fixes the current a11y issue and gives Google topical clusters).
   - Extend the existing `ItemList` JSON-LD to also emit one `Product` per item at the top of the list (top 20 is fine), with `offers.priceCurrency`, `offers.availability`, and `brand`.

2. **FAQ page (`/faq`)** — already has `FAQPage` JSON-LD; keep and expand.
   - Add 6–10 more Q&As targeting long-tail queries surfaced by `keyword_research` (Phase 5): "how do I get a Netflix subscription cheap in India", "is it legal to buy Spotify subscription from third party", "warranty on digital gift cards", etc.

3. **About (`/about`)** — add trust signals for E-E-A-T:
   - Founding year (2020), customer count, response-time SLA.
   - Real testimonials (even a 3-quote strip) with `Review` schema in the JSON-LD.

4. **Contact (`/contact`)** — add `LocalBusiness` or `Organization` JSON-LD with `contactPoint` (WhatsApp number, email, hours 10 AM–10 PM IST) so Google can render a knowledge-panel-style contact card.

## Phase 4 — New content routes (biggest ranking lever)

The site currently has 5 shareable URLs. That is a very small target surface. Add topical landing pages that map to real search queries. Each new file follows the existing `PageShell` + `PageHero` + `buildRouteHead` pattern.

Proposed new routes:

- `/products/streaming` — Netflix, Prime, Disney+, Hotstar, YouTube Premium
- `/products/ai-tools` — ChatGPT Plus, Midjourney, Claude Pro, Perplexity
- `/products/software` — Windows, Office, Adobe, JetBrains, antivirus
- `/products/gift-cards` — Amazon, Steam, Play Store, App Store
- `/how-it-works` — order → payment → delivery → warranty flow
- `/warranty` — the warranty policy in full (currently only mentioned in FAQ)
- `/blog/` index + 4–6 launch articles (comparison, buying-guide, how-to)

Each category page reuses the sheet data, filtered by category — no extra backend. Each carries its own `<h1>`, `<title>`, `<meta description>`, `og:*`, breadcrumb JSON-LD, and canonical.

## Phase 5 — Keyword & competitor research

Before writing new copy, ground it in real search behavior.

1. `keyword_research` for the anchor terms per new category page (streaming subscription India, buy ChatGPT plus India, cheap adobe subscription, etc.). Pick 3–5 primary + 5–10 long-tail per page based on volume + KDI < 40.
2. `competitive_analysis` on 2–3 domains in the same category (e.g. accsmarket, seogaz, gamivo) to surface keyword gaps.
3. `serp_analysis` on the top 5 primary keywords to confirm intent (transactional vs informational) before deciding whether a landing page or a blog post ranks better.
4. Fold the chosen keywords back into `head()` titles/descriptions, `<h1>`, `<h2>`, and the first 100 words of body copy — never as a bag of keywords.

## Phase 6 — Technical polish

Small but compounding wins.

1. **Sitemap:** extend `src/routes/sitemap[.]xml.ts` with the new routes added in Phase 4. If the blog goes live, generate `<url>` entries from post metadata.
2. **`og:image` per route:** at minimum, generate a branded 1200×630 for `/`, `/products`, `/about`, `/faq`, `/contact` and wire them into each leaf `head()` (never on `__root`).
3. **Real domain:** ranking on a `*.lovable.app` subdomain is possible but a proper apex domain compounds trust. When the user is ready, purchase `digitalplatform.in` (or similar), point via custom domain, then re-verify in Search Console — treat the `.lovable.app` URL as canonical only until the switch, then update `SITE_URL` and re-submit the sitemap.
4. **Core Web Vitals monitoring:** wire PageSpeed Insights CI or accept Search Console's monthly report. The site is already fast (static + one API call), keep it that way — avoid heavy third-party scripts.
5. **Internal linking:** ensure every new page links back to `/products` with descriptive anchor text, and that `/` links out to every category page (helps distribute PageRank).

## Phase 7 — Off-page & authority

Only meaningful after Phases 1–4 ship.

1. Set up a **Google Business Profile** (if applicable) and get the WhatsApp number listed.
2. Post 1–2 short **guides on Medium/Reddit/Quora** monthly answering the same long-tail questions the FAQ covers, linking back to the relevant `/products/*` page. Not spam — genuine, formatted answers.
3. **Partnerships / directory listings** — request listing on curated "digital subscription reseller" directories.
4. Ask happy customers for a **Trustpilot review** with the site URL — a public review profile is a ranking signal and a conversion booster.

## Technical details

### Files this plan touches

Phase 1
- `src/routes/index.tsx`, `src/routes/about.tsx`, `src/routes/__root.tsx` — trim descriptions
- `src/routes/products.tsx` — add `<h2>`
- `public/llms.txt` — new

Phase 3
- `src/routes/products.tsx` — intro copy + section h2s + Product JSON-LD block
- `src/routes/faq.tsx` (via `src/components/faq/data.ts`) — more Q&As
- `src/routes/about.tsx` — testimonials + Review schema
- `src/routes/contact.tsx` — ContactPoint schema

Phase 4
- `src/routes/products.streaming.tsx`, `products.ai-tools.tsx`, `products.software.tsx`, `products.gift-cards.tsx`
- `src/routes/how-it-works.tsx`, `src/routes/warranty.tsx`
- `src/routes/blog.index.tsx` + `blog.$slug.tsx` (deferred until content is written)

Phase 6
- `src/routes/sitemap[.]xml.ts` — new entries
- `src/assets/og-*.jpg` — generated
- Each route's `head()` — `og:image` per leaf

### Sequencing

```text
Phase 1  →  30 min   (scanner fixes)
Phase 2  →   1 h     (Search Console verify + submit)
Phase 3  →   1 day   (deepen existing pages)
Phase 5  →   2 h     (keyword research — informs Phase 4)
Phase 4  →   1 week  (new landing pages)
Phase 6  →   1 day   (og:images, sitemap, custom domain when ready)
Phase 7  →  ongoing
```

### Success metrics (check monthly in Search Console + Semrush)

- **Indexed pages:** target 10+ by month 2, 20+ by month 4.
- **Impressions:** first non-zero by week 4, 1K+/month by month 3.
- **Keywords ranked (top 100):** 5+ by month 2, 25+ by month 4.
- **Average position for brand query "digital platform subscriptions":** top 3 within 60 days.
- **CTR** on top 10 impressions: > 3%.

Phase 1 is safe to execute now with no further input. Phases 2 and 7 need the user (Search Console access, off-page outreach). Phases 3–6 I can execute end-to-end once you approve.
