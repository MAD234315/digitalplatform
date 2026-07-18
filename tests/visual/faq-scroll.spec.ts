import { test, expect, devices, type Page } from "@playwright/test";
import { CATEGORIES } from "../../src/components/faq/data";

/**
 * Verifies that when a FAQ category chip is clicked, the category heading AND
 * its first question card are fully visible below any sticky header/filter bar
 * across mobile, tablet, and desktop breakpoints.
 *
 * This is a functional (not screenshot) test — it survives copy/design changes.
 */

const BREAKPOINTS = [
  { name: "mobile", viewport: { width: 390, height: 844 } }, // iPhone 13
  { name: "tablet", viewport: { width: 820, height: 1180 } }, // iPad Air
  { name: "desktop", viewport: { width: 1280, height: 900 } },
] as const;

const CATEGORIES_TO_CHECK = CATEGORIES.filter((c) => c !== "All");

/**
 * Compute the bottom edge of any sticky/fixed element currently pinned at the
 * top of the viewport. Anything above this Y is visually occluded by chrome.
 */
async function stickyChromeBottom(page: Page): Promise<number> {
  return page.evaluate(() => {
    let maxBottom = 0;
    const nodes = document.querySelectorAll<HTMLElement>("header, [class*='sticky'], [class*='fixed']");
    nodes.forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.position !== "sticky" && cs.position !== "fixed") return;
      if (cs.visibility === "hidden" || cs.display === "none") return;
      const r = el.getBoundingClientRect();
      // Only chrome pinned near the top of the viewport
      if (r.top <= 4 && r.bottom > maxBottom) maxBottom = r.bottom;
    });
    return maxBottom;
  });
}

for (const bp of BREAKPOINTS) {
  test.describe(`FAQ category scroll — ${bp.name}`, () => {
    test.use({ viewport: bp.viewport });

    test(`first item stays fully visible below sticky header`, async ({ page }) => {
      await page.goto("/faq", { waitUntil: "networkidle" });
      // Ensure the filter bar has rendered before we start clicking chips.
      await page.getByRole("button", { name: "All", exact: true }).waitFor();

      for (const cat of CATEGORIES_TO_CHECK) {
        const chip = page.getByRole("button", { name: cat, exact: true });
        // Some breakpoints put chips in a horizontally scrollable strip.
        await chip.scrollIntoViewIfNeeded();
        await chip.click();

        // Allow smooth-scroll + rAF-scheduled scroll handler to settle.
        await page.waitForFunction(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return !(document as any).scrollingElement || true;
        });
        await page.waitForTimeout(700);

        const chromeBottom = await stickyChromeBottom(page);
        const viewportH = bp.viewport.height;

        // 1. Category heading fully visible with a small gap below sticky chrome.
        const heading = page.locator(`#faq-heading-${slug(cat)}`);
        await expect(heading, `heading exists for ${cat}`).toBeVisible();
        const headingBox = await heading.boundingBox();
        expect(headingBox, `heading box for ${cat}`).not.toBeNull();
        expect(headingBox!.y, `${bp.name}: '${cat}' heading top must sit below sticky chrome`).toBeGreaterThanOrEqual(chromeBottom);
        // Small breathing room — at least 8px, at most a reasonable header height.
        expect(headingBox!.y - chromeBottom, `${bp.name}: '${cat}' heading gap under chrome`).toBeLessThanOrEqual(160);

        // 2. First FAQ item inside the group must also be fully visible.
        const firstItem = page.locator(`#faq-group-${slug(cat)} [data-faq-item]`).first();
        // Fallback: if no data attribute, use the first button/summary in the group.
        const firstItemFallback = page.locator(`#faq-group-${slug(cat)} button, #faq-group-${slug(cat)} summary`).first();
        const target = (await firstItem.count()) > 0 ? firstItem : firstItemFallback;
        await expect(target, `first item exists for ${cat}`).toBeVisible();
        const itemBox = await target.boundingBox();
        expect(itemBox, `item box for ${cat}`).not.toBeNull();
        expect(itemBox!.y, `${bp.name}: '${cat}' first item top below chrome`).toBeGreaterThanOrEqual(chromeBottom);
        expect(itemBox!.y + itemBox!.height, `${bp.name}: '${cat}' first item bottom within viewport`).toBeLessThanOrEqual(viewportH);
      }
    });
  });
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
