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
      test.setTimeout(120_000);
      await page.goto("/faq", { waitUntil: "domcontentloaded" });
      await page.locator("button[aria-pressed]").first().waitFor();


      for (const cat of CATEGORIES_TO_CHECK) {
        const chip = page
          .locator("button[aria-pressed]", { hasText: new RegExp(`^${escapeRe(cat)}\\s·`) })
          .first();
        await chip.scrollIntoViewIfNeeded();
        const beforeY = await page.evaluate(() => window.scrollY);
        await chip.click();

        // Wait until scroll begins moving OR determine no scroll needed.
        await page
          .waitForFunction((y) => window.scrollY !== y, beforeY, { timeout: 1200 })
          .catch(() => void 0);
        // Then let smooth-scroll complete.
        await page.waitForTimeout(900);








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
          headingBox!.y + headingBox!.height,
          `${bp.name}: '${cat}' heading bottom within viewport`
        ).toBeLessThanOrEqual(viewportH);


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
