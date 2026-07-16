## Separate the three filter controls into stacked rows

Update `src/components/products/products-filter-bar.tsx` so category chips, stock chips, and the search input each occupy their own row on every screen size.

### Changes

- Replace the current two-column responsive layout with three stacked rows in a single `flex flex-col gap-2` container.
  - **Row 1**: category chips (existing horizontal-scroll chip group, unchanged behavior).
  - **Row 2**: stock chips (existing pill group), left-aligned, still horizontally scrollable on narrow screens.
  - **Row 3**: search input + suggestions dropdown, full width.
- Remove the `lg:flex-row lg:items-center lg:justify-between` desktop grouping and the inner `flex flex-row items-center gap-2 lg:shrink-0` wrapper that currently pairs stock + search.
- Drop the `lg:w-72 lg:shrink-0` width constraint on the search wrapper so it spans the full row on all breakpoints; suggestions dropdown continues to anchor to it via `absolute left-0 right-0`.
- Keep existing padding (`px-4 sm:px-6 lg:px-10 py-2 lg:py-3`), colors, chip styles, counts, keyboard/ARIA behavior, and the outer non-sticky `border-b border-border bg-background` wrapper untouched.

### Out of scope

- No changes to filter logic, `use-products-filter.ts`, or the shared `FilterBar` used by the FAQ page.
- No visual restyling of chips or search input beyond the layout regrouping.