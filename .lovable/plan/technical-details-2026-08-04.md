Swap the two content sections in the product info popup so that **Product details** (Type / Supports / Warranty) appears first, followed by **Product description** (the long description text). Also update the section headings to match the new order: "PRODUCT DETAILS" first and "PRODUCT DESCRIPTION" second.

## Technical details
- File: `src/components/products/product-info-dialog.tsx`
- Move the `<section>` containing the `InfoRow` grid (Type, Supports, Warranty) above the description section.
- Move the dashed `borderTop` divider from the second section to the first section, so the visual separator sits between the two blocks in the new order.
- Update labels:
  - First section heading: "PRODUCT DETAILS"
  - Second section heading: "PRODUCT DESCRIPTION"
- Keep the existing styling, scrollable area, close focus, and portal behavior unchanged.
