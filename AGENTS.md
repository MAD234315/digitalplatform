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
- Product presentation helpers suppress pricing-bearing text without altering source data; cards and details share the same WhatsApp enquiry link and reference-style initials artwork.
- Keep shop visual tokens scoped to product cards and details so shared site styling stays unchanged.
- Route error components must take `ErrorComponentProps` and normalize `error` (typed `unknown`) to an `Error` before use, because the router's `ErrorRouteComponent` type rejects narrower inline prop shapes.
