# Homepage Offer Banner

Add a prominent homepage banner that showcases the latest offer via photo or video, with an admin toggle to enable, upload, and configure it without touching code.

## Goals
- Display a full-width offer banner on the homepage (below the hero or at the top of the fold).
- Support both image and video media.
- Let admins enable/disable the banner and edit its content from the existing admin panel.
- Keep the existing black & gold premium design language.

## Proposed behaviour

### Homepage
- A new `OfferBanner` section renders conditionally only when the banner is enabled.
- If an image is configured: display a responsive `<img>` with object-cover.
- If a video is configured: display a muted, looped, autoplay `<video>` with a poster fallback.
- Optional text overlay: headline, subline, CTA button, and a small "Offer" badge.
- Clicking the banner or CTA navigates to the configured link (e.g. `/products` or a specific offer page).
- Banner sits between the hero and the "Ask AI" section on the home route.

### Admin panel
- A new "Offer Banner" card inside the existing **Website Settings** tab (`/admin` → Website).
- Controls:
  - Enable/disable toggle.
  - Media type selector: Image or Video.
  - File upload for image/video (stored in a dedicated storage bucket).
  - Headline, subline, CTA text, and CTA link inputs.
  - Live preview of the banner using the current values.
- Changes take effect immediately after save.

## Technical plan

### Database
Create a single-row settings table `public.offer_banner`:
- `id` serial primary key (or a fixed singleton row with `id = 1`).
- `enabled` boolean default false.
- `media_type` enum/text: `'image' | 'video'`.
- `media_path` text — storage object path.
- `media_url` text — public or signed URL cache.
- `headline` text nullable.
- `subline` text nullable.
- `cta_text` text nullable.
- `cta_link` text nullable.
- `updated_at` timestamptz default now().

Add standard GRANTs, enable RLS, and add policies:
- `SELECT` for `anon` and `authenticated` (public read for homepage).
- `INSERT/UPDATE/DELETE` restricted to admins via `public.has_role(..., 'admin')`.

### Storage
- Create a public bucket `offer-banners` for uploaded media.
- Set a reasonable file-size limit (e.g. 10 MB) and allowed MIME types (`image/*`, `video/mp4`, `video/webm`).
- Homepage reads the public URL directly; admin panel uses signed upload.

### Server functions
In `src/lib/admin.functions.ts` (or a new `src/lib/banner.functions.ts`):
- `getOfferBanner()` — public read, returns the active banner row.
- `upsertOfferBanner(input)` — admin-only, validates fields, handles media upload/replacement, updates the row.

### Admin UI
- Add an `OfferBannerCard` component rendered inside `WebsitePanel` in `src/routes/admin.index.tsx`.
- Use existing `useServerFn` + `useQuery`/`useMutation` pattern.
- Upload via `supabase.storage.from('offer-banners').upload()` then persist the path.
- Show a small preview thumbnail.

### Homepage component
- Create `src/components/home/OfferBanner.tsx`.
- Accept banner data as props; render image or video with overlay text.
- Wire it into `src/routes/index.tsx` between `<HeroSection />` and `<AskAiSection />`.
- Use the existing `CtaRouterLink` / `Link` component for the CTA.

### Styling
- Full-width container with `max-w-7xl` or edge-to-edge option.
- Rounded corners, subtle gold border, and a small "Latest Offer" badge.
- Responsive: maintain 16:9 aspect ratio on desktop, slightly taller on mobile.
- Text overlay positioned bottom-left with a dark gradient scrim for readability.

## Open questions
1. Should the banner be edge-to-edge full width or contained within the `max-w-6xl` page grid?
2. Do you have an initial offer image/video to upload, or should we start with a placeholder?
3. Should the banner auto-hide after an expiry date, or is the on/off toggle sufficient?

## Acceptance criteria
- [ ] Admins can upload an image or video and toggle the banner from `/admin` → Website Settings.
- [ ] The banner appears on the homepage only when enabled.
- [ ] Image and video media render correctly on desktop and mobile.
- [ ] Clicking the banner/CTA navigates to the configured link.
- [ ] Non-admins cannot modify banner settings (RLS + server-function auth).
