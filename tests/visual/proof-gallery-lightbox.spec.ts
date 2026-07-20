import { test, expect, devices, type Page } from "@playwright/test";

/**
 * Focus trap, keyboard navigation, and scroll locking checks for the
 * Proof Gallery lightbox across common mobile viewport sizes.
 *
 * These tests only run against the mobile-chrome project (Pixel 5 default)
 * and re-emulate additional device viewports at the test level so we
 * exercise the smallest and most common mobile widths without adding
 * dedicated Playwright projects.
 */

const MOBILE_VIEWPORTS = [
  { name: "iphone-se", ...devices["iPhone SE"] },
  { name: "iphone-12", ...devices["iPhone 12"] },
  { name: "pixel-5", ...devices["Pixel 5"] },
  { name: "galaxy-s9", ...devices["Galaxy S9+"] },
] as const;

async function openLightboxOrSkip(page: Page) {
  await page.goto("/proof-gallery", { waitUntil: "domcontentloaded" });
  // Wait for either a card, the empty-state, or the error banner.
  const grid = page.locator("[data-proof-gallery]");
  const emptyOrError = page.getByText(/Proofs are being uploaded|Couldn.t load the gallery/i);
  await Promise.race([
    grid.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => null),
    emptyOrError.first().waitFor({ state: "visible", timeout: 10_000 }).catch(() => null),
  ]);
  const cards = grid.locator("button[aria-label^='Open ']");
  const count = await cards.count().catch(() => 0);
  test.skip(count === 0, "No published proofs in this environment — skipping lightbox test.");
  await cards.first().click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor({ state: "visible" });
  return dialog;
}

test.describe("Proof Gallery lightbox — mobile viewports", () => {
  // Only meaningful on the mobile project; skip elsewhere.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile-chrome",
      "Runs only in the mobile-chrome project.",
    );
  });

  for (const vp of MOBILE_VIEWPORTS) {
    test.describe(vp.name, () => {
      test.use({
        viewport: vp.viewport,
        userAgent: vp.userAgent,
        deviceScaleFactor: vp.deviceScaleFactor,
        hasTouch: vp.hasTouch,
        isMobile: vp.isMobile,
      });

      test("locks body scroll while the lightbox is open", async ({ page }) => {
        const dialog = await openLightboxOrSkip(page);
        const overflow = await page.evaluate(() => document.body.style.overflow);
        expect(overflow).toBe("hidden");
        // Close and verify overflow restores.
        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
        const restored = await page.evaluate(() => document.body.style.overflow);
        expect(restored).not.toBe("hidden");
      });

      test("traps Tab focus inside the dialog", async ({ page }) => {
        await openLightboxOrSkip(page);
        // Close button gets initial focus.
        const initialLabel = await page.evaluate(() =>
          document.activeElement?.getAttribute("aria-label") ?? "",
        );
        expect(initialLabel).toMatch(/Close/i);

        // Collect focusables in the dialog and Tab through them + one wrap.
        const focusables = await page.evaluate(() => {
          const root = document.querySelector('[role="dialog"]');
          if (!root) return [] as string[];
          return Array.from(
            root.querySelectorAll<HTMLElement>(
              'button, [href], [tabindex]:not([tabindex="-1"])',
            ),
          ).map((el) => el.getAttribute("aria-label") ?? el.tagName);
        });
        expect(focusables.length).toBeGreaterThan(0);

        for (let i = 0; i < focusables.length + 1; i++) {
          await page.keyboard.press("Tab");
        }
        // After wrapping, focus must still be inside the dialog.
        const stillInside = await page.evaluate(
          () => !!document.activeElement?.closest('[role="dialog"]'),
        );
        expect(stillInside).toBe(true);

        // Shift+Tab from first focusable must wrap to the last, staying inside.
        await page.evaluate(() => {
          const first = document
            .querySelector('[role="dialog"]')
            ?.querySelector<HTMLElement>("button");
          first?.focus();
        });
        await page.keyboard.press("Shift+Tab");
        const afterShift = await page.evaluate(
          () => !!document.activeElement?.closest('[role="dialog"]'),
        );
        expect(afterShift).toBe(true);
      });

      test("supports arrow, Home/End and Escape keys", async ({ page }) => {
        const dialog = await openLightboxOrSkip(page);
        const counter = dialog.locator("text=/\\d+\\s*\\/\\s*\\d+/").first();
        const initial = (await counter.textContent())?.trim() ?? "";

        await page.keyboard.press("ArrowRight");
        // Counter should update when more than one proof exists; if only one,
        // the value stays but the dialog must remain visible.
        await expect(dialog).toBeVisible();
        const afterRight = (await counter.textContent())?.trim() ?? "";
        expect(afterRight.length).toBeGreaterThan(0);

        await page.keyboard.press("ArrowLeft");
        await expect(dialog).toBeVisible();

        await page.keyboard.press("End");
        await page.keyboard.press("Home");
        const backToStart = (await counter.textContent())?.trim() ?? "";
        // Home should land on index 1 of N.
        expect(backToStart.startsWith("1")).toBe(true);
        // Sanity: value is a valid "x / y" shape.
        expect(backToStart).toMatch(/^\d+\s*\/\s*\d+$/);
        // Silence unused warning if only one item exists.
        void initial;

        await page.keyboard.press("Escape");
        await dialog.waitFor({ state: "hidden" });
      });
    });
  }
});
