import { test, expect, type Page } from "@playwright/test";
import { CATEGORIES } from "../../src/components/faq/data";

/**
 * Verifies that when a FAQ category chip is clicked, the category heading AND
 * its first question card are fully visible below any sticky header/filter bar
 * across mobile, tablet, and desktop breakpoints.
 *
 * Functional (not screenshot) test — resilient to copy/design changes.
 */

const BREAKPOINTS = [
  { name: "mobile", viewport: { width: 390, height: 844 } },
  { name: "tablet", viewport: { width: 820, height: 1180 } },
  { name: "desktop", viewport: { width: 1280, height: 900 } },
] as const;

const CATEGORIES_TO_CHECK = CATEGORIES.filter((c) => c !== "All");

async function stickyChromeBottom(page: Page): Promise<number> {
  return page.evaluate(() => {
    let maxBottom = 0;
    document.querySelectorAll<HTMLElement>("*").forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.position !== "sticky" && cs.position !== "fixed") return;
      if (cs.visibility === "hidden" || cs.display === "none") return;
      const r = el.getBoundingClientRect();
      if (r.width < 100 || r.height < 8) return;
      if (r.top <= 4 && r.bottom > maxBottom) maxBottom = r.bottom;
    });
    return maxBottom;
  });
}

for (const bp of BREAKPOINTS) {
  test.describe(`FAQ category scroll — ${bp.name}`, () => {
    test.use({ viewport: bp.viewport });

    test(`first item stays fully visible below sticky header`, async ({ page }) => {
      await page.goto("/faq", { waitUntil: "domcontentloaded" });
      await page.locator("button[aria-pressed]").first().waitFor();

      for (const cat of CATEGORIES_TO_CHECK) {
        const chip = page
          .locator("button[aria-pressed]", { hasText: new RegExp(`^${escapeRe(cat)}\\s·`) })
          .first();
        await chip.scrollIntoViewIfNeeded();
        await chip.click();

        // Wait for smooth-scroll to fully settle (poll scrollY until stable).
        await page.waitForFunction(
          () => {
            const w = window as unknown as { __lastY?: number; __stableTicks?: number };
            const y = window.scrollY;
            if (w.__lastY === y) {
              w.__stableTicks = (w.__stableTicks ?? 0) + 1;
            } else {
              w.__stableTicks = 0;
              w.__lastY = y;
            }
            return (w.__stableTicks ?? 0) >= 6;
          },
          { polling: 100, timeout: 5000 }
        );
        await page.evaluate(() => {
          const w = window as unknown as { __lastY?: number; __stableTicks?: number };
          w.__lastY = undefined;
          w.__stableTicks = 0;
        });



        const chromeBottom = await stickyChromeBottom(page);
        const viewportH = bp.viewport.height;

        const heading = page.locator(`#faq-heading-${slug(cat)}`);
        await expect(heading, `heading exists for ${cat}`).toBeVisible();
        const headingBox = await heading.boundingBox();
        expect(headingBox, `heading box for ${cat}`).not.toBeNull();
        expect(
          headingBox!.y,
          `${bp.name}: '${cat}' heading top must sit at/below sticky chrome`
        ).toBeGreaterThanOrEqual(chromeBottom - 1);
        expect(
          headingBox!.y - chromeBottom,
          `${bp.name}: '${cat}' heading gap under chrome`
        ).toBeLessThanOrEqual(200);

        const firstSummary = page
          .locator(`#faq-group-${slug(cat)} details summary`)
          .first();
        await expect(firstSummary, `first summary exists for ${cat}`).toBeVisible();
        const itemBox = await firstSummary.boundingBox();
        expect(itemBox, `item box for ${cat}`).not.toBeNull();
        expect(
          itemBox!.y,
          `${bp.name}: '${cat}' first item top must be below sticky chrome`
        ).toBeGreaterThanOrEqual(chromeBottom - 1);
        expect(
          itemBox!.y + itemBox!.height,
          `${bp.name}: '${cat}' first item bottom within viewport`
        ).toBeLessThanOrEqual(viewportH);
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

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
