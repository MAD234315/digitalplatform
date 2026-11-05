<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Product details URLs use a deterministic catalogue identity in a separate `/product/$productSlug` route, so spreadsheet row reordering cannot open the wrong product.
- Product presentation helpers suppress pricing-bearing text without altering source data; cards and details share the same WhatsApp enquiry link and individual product illustration.
- Product pictures are mapped by deterministic catalogue URL identity, with row identifiers only for otherwise identical duplicate rows; an optional validated artworkRow search parameter preserves duplicate-card artwork on details and zoom, and unmapped products use a placeholder.
- Keep shop visual tokens scoped to product cards and details so shared site styling stays unchanged.
- Route error components must take `ErrorComponentProps` and normalize `error` (typed `unknown`) to an `Error` before use, because the router's `ErrorRouteComponent` type rejects narrower inline prop shapes.
- Offer banner management lives in a focused admin component with authenticated draft reads; save settings before deleting replaced media so failed saves preserve the current banner.
- Product artwork is generated as SVG from each product's identity (colours, pattern, wordmark, section icon), so it is sharp at any size and new sheet products get artwork automatically; the details page shows one small compact picture beside the name, with a larger view only on tap.
