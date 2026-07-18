import { test, expect } from "@playwright/test";

/**
 * Visual regression: "Our Services" section on the homepage.
 * Guards against alignment/spacing drift across mobile and desktop.
 *
 * If an intentional design change occurs, refresh baselines with:
 *   bun run test:visual:update
 */
test.describe("Our Services — visual regression", () => {
  test("matches baseline screenshot", async ({ page }, testInfo) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Disable animations & reveal-on-scroll so screenshots are deterministic.
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        [data-reveal], .reveal, [class*="opacity-0"] {
          opacity: 1 !important;
          transform: none !important;
        }
      `,
    });

    // Locate the section by its heading; matches "Our Services".
    const heading = page.getByRole("heading", { name: /our services/i });
    await heading.waitFor({ state: "visible" });

    // Walk up to the enclosing <section> for a stable clip target.
    const section = heading.locator("xpath=ancestor::section[1]");
    await section.scrollIntoViewIfNeeded();

    // Wait for web fonts so glyph metrics don't shift between runs.
    await page.evaluate(() => (document as any).fonts?.ready);

    await expect(section).toHaveScreenshot(`our-services-${testInfo.project.name}.png`);
  });
});
